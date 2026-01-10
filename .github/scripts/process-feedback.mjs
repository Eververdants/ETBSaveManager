import { Octokit } from "@octokit/rest";
import * as core from "@actions/core";

const gistId = process.env.GIST_ID;
const token = process.env.GITHUB_TOKEN;

if (!gistId || !token) {
  core.setFailed("Missing GIST_ID or GITHUB_TOKEN");
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

async function main() {
  try {
    // 1. 获取 Gist 的所有评论
    const { data: comments } = await octokit.rest.gists.listComments({
      gist_id: gistId,
    });

    // 2. 找出未处理的评论（比如没有 "[PROCESSED]" 标记）
    const unprocessed = comments.filter(c => !c.body.includes("[PROCESSED]"));

    for (const comment of unprocessed) {
      console.log(`Processing comment #${comment.id}: ${comment.body.substring(0, 50)}...`);

      // 3. 创建 GitHub Issue
      await octokit.rest.issues.create({
        owner: "Eververdants",
        repo: "ETBSaveManager",
        title: "User Feedback",
        body: `From Gist comment ID: ${comment.id}\n\n---\n\n${comment.body}`,
        labels: ["feedback"]
      });

      // 4. 更新评论，标记为已处理（防止重复）
      await octokit.rest.gists.updateComment({
        gist_id: gistId,
        comment_id: comment.id,
        body: `${comment.body}\n\n[PROCESSED]`
      });
    }

    console.log(`Processed ${unprocessed.length} feedback(s).`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();