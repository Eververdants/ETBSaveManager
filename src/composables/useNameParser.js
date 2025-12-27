import { ref, computed } from 'vue'

/**
 * 智能名称解析器 composable
 * 支持多格式输入解析、关键词识别、序号展开、CSV解析
 * 
 * @see docs/SMART_INPUT_STANDARD.md
 */

// ============ 关键词映射配置 ============

// 层级关键词映射（按长度降序排列以优先匹配更长的）
const LEVEL_KEYWORDS = {
  '支线5': 'branch5',
  '支线4': 'branch4',
  '支线3': 'branch3',
  '支线2': 'branch2',
  '支线1': 'branch1',
  '主线A': 'main',
  '主线': 'main',
  'branch5': 'branch5',
  'branch4': 'branch4',
  'branch3': 'branch3',
  'branch2': 'branch2',
  'branch1': 'branch1',
  'main': 'main'
}

// 难度关键词映射
const DIFFICULTY_KEYWORDS = {
  'nightmare': 'nightmare',
  '噩梦': 'nightmare',
  'BOSS': 'nightmare',
  'Boss': 'nightmare',
  'boss': 'nightmare',
  '困难': 'hard',
  'hard': 'hard',
  'Hard': 'hard',
  '普通': 'normal',
  'normal': 'normal',
  'Normal': 'normal',
  '简单': 'easy',
  'easy': 'easy',
  'Easy': 'easy'
}

// 背包关键词映射
const BACKPACK_KEYWORDS = {
  '新手包': 'starter',
  '标准包': 'standard',
  '豪华包': 'deluxe',
  '至尊包': 'ultimate',
  'starter': 'starter',
  'standard': 'standard',
  'deluxe': 'deluxe',
  'ultimate': 'ultimate'
}

// CSV列名别名映射
const COLUMN_ALIASES = {
  name: ['存档名称', 'name', '名称', '存档名', 'title', 'Name', 'NAME'],
  level: ['层级线路', 'level', '层级', '线路', '关卡', 'route', 'Level', 'LEVEL'],
  difficulty: ['存档难度', 'difficulty', '难度', 'diff', 'Difficulty', 'DIFFICULTY'],
  actualDifficulty: ['实际难度', 'realDifficulty', '真实难度', 'actual', 'ActualDifficulty'],
  backpack: ['背包配置', 'backpack', '背包', '物品', 'inventory', 'Backpack', 'BACKPACK']
}

// 序号正则 - 匹配末尾数字（可选前缀 _ 或 -）
const INDEX_PATTERN = /[_\-]?(\d{1,4})$/

// 序号展开正则 - 匹配 {1-50} 或 [001-100] 或 {A-Z}
const RANGE_PATTERN = /[{\[](\d+|[A-Za-z])-(\d+|[A-Za-z])[}\]]/g

// ============ 工具函数 ============

/**
 * 检测分隔符类型
 * @param {string} line - 单行文本
 * @returns {'tab' | 'comma' | 'semicolon' | 'none'}
 */
function detectDelimiter(line) {
  if (!line) return 'none'
  
  // 按优先级检测
  if (line.includes('\t')) return 'tab'
  if (line.includes(',')) return 'comma'
  if (line.includes(';')) return 'semicolon'
  return 'none'
}

/**
 * 解析CSV行（支持引号转义）
 * @param {string} line - CSV行
 * @param {string} delimiter - 分隔符
 * @returns {string[]}
 */
function parseCSVLine(line, delimiter = ',') {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 双引号转义
        current += '"'
        i++
      } else {
        // 切换引号状态
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

/**
 * 清理单个值
 * @param {string} value 
 * @returns {string | null}
 */
function cleanValue(value) {
  if (!value || typeof value !== 'string') return null
  
  const trimmed = value.trim()
  
  // 空值处理
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'null') {
    return null
  }
  
  // 去除首尾引号
  return trimmed.replace(/^["']|["']$/g, '')
}

/**
 * 检查是否为注释行
 * @param {string} line 
 * @returns {boolean}
 */
function isCommentLine(line) {
  const trimmed = line.trim()
  return trimmed.startsWith('#') || trimmed.startsWith('//')
}

/**
 * 检查是否为表头行
 * @param {string[]} fields 
 * @returns {boolean}
 */
function isHeaderRow(fields) {
  const allAliases = Object.values(COLUMN_ALIASES).flat()
  const matchCount = fields.filter(f => 
    allAliases.some(alias => 
      alias.toLowerCase() === f.toLowerCase()
    )
  ).length
  return matchCount >= 1
}

/**
 * 映射列名到标准字段
 * @param {string[]} headers 
 * @returns {Object<string, number>}
 */
function mapColumns(headers) {
  const mapping = {}
  
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim()
      if (aliases.some(alias => alias.toLowerCase() === header)) {
        mapping[field] = i
        break
      }
    }
  }
  
  // 如果没有找到name列，默认第一列为name
  if (mapping.name === undefined && headers.length > 0) {
    mapping.name = 0
  }
  
  return mapping
}

/**
 * 展开序号范围
 * @param {string} template - 包含范围标记的模板，如 "存档_{1-5}"
 * @returns {string[]}
 */
function expandRange(template) {
  const results = []
  const match = template.match(RANGE_PATTERN)
  
  if (!match) {
    return [template]
  }
  
  // 只处理第一个范围标记
  const rangeMatch = template.match(/[{\[](\d+|[A-Za-z])-(\d+|[A-Za-z])[}\]]/)
  if (!rangeMatch) return [template]
  
  const [fullMatch, start, end] = rangeMatch
  const prefix = template.slice(0, rangeMatch.index)
  const suffix = template.slice(rangeMatch.index + fullMatch.length)
  
  // 数字范围
  if (/^\d+$/.test(start) && /^\d+$/.test(end)) {
    const startNum = parseInt(start, 10)
    const endNum = parseInt(end, 10)
    const padLength = start.length // 保留前导零
    
    const min = Math.min(startNum, endNum)
    const max = Math.max(startNum, endNum)
    
    // 限制最大展开数量
    if (max - min > 1000) {
      console.warn('Range too large, limiting to 1000')
      for (let i = min; i <= min + 999; i++) {
        results.push(prefix + String(i).padStart(padLength, '0') + suffix)
      }
    } else {
      for (let i = min; i <= max; i++) {
        results.push(prefix + String(i).padStart(padLength, '0') + suffix)
      }
    }
  }
  // 字母范围
  else if (/^[A-Za-z]$/.test(start) && /^[A-Za-z]$/.test(end)) {
    const startCode = start.charCodeAt(0)
    const endCode = end.charCodeAt(0)
    
    const min = Math.min(startCode, endCode)
    const max = Math.max(startCode, endCode)
    
    for (let i = min; i <= max; i++) {
      results.push(prefix + String.fromCharCode(i) + suffix)
    }
  }
  
  return results.length > 0 ? results : [template]
}

// ============ 核心解析函数 ============

/**
 * @typedef {Object} NameHighlight
 * @property {number} start - 高亮起始位置
 * @property {number} end - 高亮结束位置
 * @property {'index' | 'level' | 'difficulty'} type - 高亮类型
 * @property {'blue' | 'orange'} color - 高亮颜色
 */

/**
 * @typedef {Object} ParsedNameInfo
 * @property {string} originalName - 原始名称
 * @property {number | null} index - 识别的序号
 * @property {string | null} levelKeyword - 识别的层级关键词
 * @property {string | null} levelValue - 层级值
 * @property {string | null} difficultyKeyword - 识别的难度关键词
 * @property {string | null} difficultyValue - 难度值
 * @property {string | null} backpackKeyword - 识别的背包关键词
 * @property {string | null} backpackValue - 背包值
 * @property {NameHighlight[]} highlights - 高亮区域列表
 */

/**
 * 解析单个名称，识别关键词和序号
 * @param {string} name - 存档名称
 * @returns {ParsedNameInfo}
 */
export function parseName(name) {
  const result = {
    originalName: name,
    index: null,
    levelKeyword: null,
    levelValue: null,
    difficultyKeyword: null,
    difficultyValue: null,
    backpackKeyword: null,
    backpackValue: null,
    highlights: []
  }

  if (!name || typeof name !== 'string') {
    return result
  }

  // 1. 识别序号（蓝色高亮）
  const indexMatch = name.match(INDEX_PATTERN)
  if (indexMatch) {
    result.index = parseInt(indexMatch[1], 10)
    const fullMatch = indexMatch[0]
    const startPos = name.length - fullMatch.length
    result.highlights.push({
      start: startPos,
      end: name.length,
      type: 'index',
      color: 'blue'
    })
  }

  // 2. 识别层级关键词（橙色高亮）
  const sortedLevelKeywords = Object.keys(LEVEL_KEYWORDS).sort((a, b) => b.length - a.length)
  for (const keyword of sortedLevelKeywords) {
    const keywordIndex = name.indexOf(keyword)
    if (keywordIndex !== -1) {
      result.levelKeyword = keyword
      result.levelValue = LEVEL_KEYWORDS[keyword]
      result.highlights.push({
        start: keywordIndex,
        end: keywordIndex + keyword.length,
        type: 'level',
        color: 'orange'
      })
      break
    }
  }

  // 3. 识别难度关键词（橙色高亮）
  const sortedDifficultyKeywords = Object.keys(DIFFICULTY_KEYWORDS).sort((a, b) => b.length - a.length)
  for (const keyword of sortedDifficultyKeywords) {
    const keywordIndex = name.indexOf(keyword)
    if (keywordIndex !== -1) {
      result.difficultyKeyword = keyword
      result.difficultyValue = DIFFICULTY_KEYWORDS[keyword]
      result.highlights.push({
        start: keywordIndex,
        end: keywordIndex + keyword.length,
        type: 'difficulty',
        color: 'orange'
      })
      break
    }
  }

  // 4. 识别背包关键词
  const sortedBackpackKeywords = Object.keys(BACKPACK_KEYWORDS).sort((a, b) => b.length - a.length)
  for (const keyword of sortedBackpackKeywords) {
    const keywordIndex = name.indexOf(keyword)
    if (keywordIndex !== -1) {
      result.backpackKeyword = keyword
      result.backpackValue = BACKPACK_KEYWORDS[keyword]
      break
    }
  }

  // 按起始位置排序高亮区域
  result.highlights.sort((a, b) => a.start - b.start)

  return result
}

/**
 * @typedef {Object} ParsedRecord
 * @property {string} name - 存档名称
 * @property {string | null} level - 层级
 * @property {string | null} difficulty - 难度
 * @property {string | null} actualDifficulty - 实际难度
 * @property {string | null} backpack - 背包配置
 * @property {ParsedNameInfo} parsed - 名称解析结果
 * @property {string[]} warnings - 警告信息
 */

/**
 * @typedef {Object} ParseResult
 * @property {ParsedRecord[]} records - 解析后的记录
 * @property {string[]} errors - 错误信息
 * @property {string[]} warnings - 警告信息
 * @property {string[]} info - 提示信息
 * @property {Object} stats - 统计信息
 */

/**
 * 解析多行输入（智能识别格式）
 * @param {string} input - 多行文本输入
 * @returns {ParseResult}
 */
export function parseMultiple(input) {
  const result = {
    records: [],
    errors: [],
    warnings: [],
    info: [],
    stats: {
      total: 0,
      levelDetected: 0,
      difficultyDetected: 0,
      duplicates: 0
    }
  }

  if (!input || typeof input !== 'string') {
    return result
  }

  // 按换行符分割
  const lines = input.split(/\r?\n/)
  
  // 检测是否有表头
  let hasHeader = false
  let columnMapping = { name: 0 }
  let delimiter = 'none'
  
  // 找到第一个非空非注释行
  let firstDataLineIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line && !isCommentLine(line)) {
      delimiter = detectDelimiter(line)
      const fields = delimiter !== 'none' 
        ? parseCSVLine(line, delimiter === 'tab' ? '\t' : delimiter === 'semicolon' ? ';' : ',')
        : [line]
      
      if (isHeaderRow(fields)) {
        hasHeader = true
        columnMapping = mapColumns(fields)
        firstDataLineIndex = i + 1
        result.info.push(`检测到表头行，自动映射列名`)
      } else {
        firstDataLineIndex = i
      }
      break
    }
    firstDataLineIndex = i + 1
  }

  // 用于检测重复
  const seenNames = new Set()
  
  // 解析数据行
  for (let i = firstDataLineIndex; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    
    // 跳过空行和注释
    if (!trimmedLine || isCommentLine(trimmedLine)) {
      continue
    }
    
    // 解析字段
    const delimiterChar = delimiter === 'tab' ? '\t' : delimiter === 'semicolon' ? ';' : ','
    const fields = delimiter !== 'none' 
      ? parseCSVLine(trimmedLine, delimiterChar)
      : [trimmedLine]
    
    // 提取各字段值
    const name = cleanValue(fields[columnMapping.name])
    if (!name) continue
    
    // 检查序号展开
    const expandedNames = expandRange(name)
    
    for (const expandedName of expandedNames) {
      // 检测重复
      if (seenNames.has(expandedName)) {
        result.stats.duplicates++
        result.warnings.push(`存档名称重复: ${expandedName}`)
        continue
      }
      seenNames.add(expandedName)
      
      // 解析名称中的关键词
      const parsed = parseName(expandedName)
      
      // 构建记录
      const record = {
        name: expandedName,
        level: cleanValue(fields[columnMapping.level]) || null,
        difficulty: cleanValue(fields[columnMapping.difficulty]) || null,
        actualDifficulty: cleanValue(fields[columnMapping.actualDifficulty]) || null,
        backpack: cleanValue(fields[columnMapping.backpack]) || null,
        parsed,
        warnings: []
      }
      
      // 如果CSV没有提供值，使用关键词识别的值
      if (!record.level && parsed.levelValue) {
        record.level = parsed.levelValue
      }
      if (!record.difficulty && parsed.difficultyValue) {
        record.difficulty = parsed.difficultyValue
      }
      if (!record.backpack && parsed.backpackValue) {
        record.backpack = parsed.backpackValue
      }
      
      // 统计
      if (parsed.levelKeyword) result.stats.levelDetected++
      if (parsed.difficultyKeyword) result.stats.difficultyDetected++
      
      result.records.push(record)
    }
  }
  
  result.stats.total = result.records.length
  
  if (result.records.length === 0) {
    result.errors.push('未找到有效数据')
  } else {
    result.info.push(`成功识别 ${result.records.length} 个存档`)
  }
  
  if (result.stats.duplicates > 0) {
    result.warnings.push(`${result.stats.duplicates} 个存档名称重复已跳过`)
  }

  return result
}

/**
 * 解析CSV文件内容
 * @param {string} content - CSV文件内容
 * @returns {ParseResult}
 */
export function parseCSV(content) {
  return parseMultiple(content)
}

/**
 * 解析名称数组
 * @param {string[]} names - 名称数组
 * @returns {ParsedNameInfo[]}
 */
export function parseNames(names) {
  if (!Array.isArray(names)) {
    return []
  }

  return names
    .filter(name => name && typeof name === 'string' && name.trim())
    .map(name => parseName(name.trim()))
}

// ============ Composable ============

/**
 * 名称解析器 composable
 * @returns {Object}
 */
export function useNameParser() {
  const parsedNames = ref([])
  const rawInput = ref('')
  const parseResult = ref(null)

  /**
   * 解析输入文本
   * @param {string} input
   */
  const parseInput = (input) => {
    rawInput.value = input
    const result = parseMultiple(input)
    parseResult.value = result
    parsedNames.value = result.records.map(r => r.parsed)
  }

  /**
   * 添加单个名称
   * @param {string} name
   */
  const addName = (name) => {
    if (name && name.trim()) {
      const parsed = parseName(name.trim())
      parsedNames.value.push(parsed)
    }
  }

  /**
   * 移除指定索引的名称
   * @param {number} index
   */
  const removeName = (index) => {
    if (index >= 0 && index < parsedNames.value.length) {
      parsedNames.value.splice(index, 1)
    }
  }

  /**
   * 清空所有名称
   */
  const clearNames = () => {
    parsedNames.value = []
    rawInput.value = ''
    parseResult.value = null
  }

  // 计算属性
  const nameCount = computed(() => parsedNames.value.length)
  
  const levelDetectedCount = computed(() => 
    parsedNames.value.filter(p => p.levelKeyword !== null).length
  )
  
  const difficultyDetectedCount = computed(() => 
    parsedNames.value.filter(p => p.difficultyKeyword !== null).length
  )

  return {
    // 状态
    parsedNames,
    rawInput,
    parseResult,
    nameCount,
    levelDetectedCount,
    difficultyDetectedCount,
    
    // 方法
    parseInput,
    addName,
    removeName,
    clearNames,
    
    // 导出纯函数
    parseName,
    parseMultiple,
    parseNames,
    parseCSV
  }
}

// 导出常量供测试
export { 
  LEVEL_KEYWORDS, 
  DIFFICULTY_KEYWORDS, 
  BACKPACK_KEYWORDS,
  COLUMN_ALIASES,
  INDEX_PATTERN,
  RANGE_PATTERN,
  expandRange,
  parseCSVLine,
  detectDelimiter
}
