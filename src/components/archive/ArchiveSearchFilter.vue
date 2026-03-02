<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, toRef } from "vue";
import { useI18n } from "vue-i18n";
import CustomDropdown from "../ui/CustomDropdown.vue";
import { safeModifyBodyStyles, protectFloatingButtonPosition } from "../../utils/floatingButtonProtection.js";
import { useSearchState, useArchiveFilter, useFilterState } from "@/composables/useArchiveSearchFilter";

const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  archives: { type: Array, default: () => [] },
  initialFilters: {
    type: Object,
    default: () => ({
      searchQuery: "",
      selectedArchiveDifficulty: "",
      selectedActualDifficulty: "",
      selectedVisibility: "",
    }),
  },
  animationDelay: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
});

const emit = defineEmits(["filtered", "filters-changed"]);

const archivesRef = toRef(props, "archives");
const initialFiltersRef = toRef(props, "initialFilters");
const visibleRef = toRef(props, "visible");

const { searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility } = useSearchState(initialFiltersRef);
const { filteredArchives } = useArchiveFilter(archivesRef, searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility);
const { hasActiveFilters } = useFilterState(searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility);

const difficultyOptions = computed(() => [
  { value: "", label: t("archiveSearch.allDifficulties") },
  { value: "easy", label: t("createArchive.difficultyLevels.easy") },
  { value: "normal", label: t("createArchive.difficultyLevels.normal") },
  { value: "hard", label: t("createArchive.difficultyLevels.hard") },
  { value: "nightmare", label: t("createArchive.difficultyLevels.nightmare") },
]);

const visibilityOptions = computed(() => [
  { value: "", label: t("archiveSearch.allVisibilities") },
  { value: "visible", label: t("archiveSearch.visible") },
  { value: "hidden", label: t("archiveSearch.hidden") },
]);

const emitFiltersChanged = () => {
  emit("filters-changed", {
    searchQuery: searchQuery.value,
    selectedArchiveDifficulty: selectedArchiveDifficulty.value,
    selectedActualDifficulty: selectedActualDifficulty.value,
    selectedVisibility: selectedVisibility.value,
  });
};

const handleSearchChange = () => {
  nextTick(() => {
    emit("filtered", filteredArchives.value);
    emitFiltersChanged();
  });
};

const handleFilterChange = () => {
  emit("filtered", filteredArchives.value);
  emitFiltersChanged();
};

const clearSearch = () => {
  searchQuery.value = "";
  emit("filtered", filteredArchives.value);
  emitFiltersChanged();
};

const showComponent = ref(true);

watch(
  () => visibleRef.value,
  (newVal) => {
    showComponent.value = newVal;
    const mainContent = document.querySelector(".main-content");
    const archiveListContainer = document.querySelector(".archive-list-container");

    if (newVal) {
      if (mainContent) {
        mainContent.dataset.scrollY = mainContent.scrollTop;
        mainContent.style.overflow = "hidden";
      }
      if (archiveListContainer) {
        archiveListContainer.dataset.scrollY = archiveListContainer.scrollTop;
        archiveListContainer.style.overflow = "hidden";
      }

      const currentScrollY = window.scrollY;
      safeModifyBodyStyles({ overflow: "hidden", position: "fixed", top: `-${currentScrollY}px`, width: "100%", height: "100vh" });
    } else {
      if (mainContent) {
        mainContent.style.overflow = "";
        if (mainContent.dataset.scrollY) {
          mainContent.scrollTo({ top: parseInt(mainContent.dataset.scrollY), behavior: "smooth" });
        }
      }
      if (archiveListContainer) {
        archiveListContainer.style.overflow = "";
        if (archiveListContainer.dataset.scrollY) {
          archiveListContainer.scrollTo({ top: parseInt(archiveListContainer.dataset.scrollY), behavior: "smooth" });
        }
      }

      safeModifyBodyStyles({ overflow: "", position: "", top: "", width: "", height: "auto" });
      protectFloatingButtonPosition();

      const scrollY = document.body.style.top;
      if (scrollY) {
        window.scrollTo({ top: parseInt(scrollY || "0") * -1, behavior: "smooth" });
      }
    }
  },
  { immediate: true }
);

const beforeEnter = (el) => {
  el.style.willChange = "opacity, transform";
  el.style.opacity = "0";
  el.style.transform = "translateY(-15px)";
};

const enter = (el, done) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      setTimeout(() => {
        el.style.transition = "";
        el.style.willChange = "";
        done();
      }, 300);
    });
  });
};

const leave = (el, done) => {
  el.style.willChange = "opacity, transform";
  el.style.transition = "opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)";
  el.style.opacity = "0";
  el.style.transform = "translateY(-8px)";
  setTimeout(() => {
    el.style.transition = "";
    el.style.willChange = "";
    done();
  }, 250);
};

watch(searchQuery, handleSearchChange);

watch(
  () => props.initialFilters,
  (newFilters) => {
    if (!newFilters) return;
    searchQuery.value = newFilters.searchQuery || "";
    selectedArchiveDifficulty.value = newFilters.selectedArchiveDifficulty || "";
    selectedActualDifficulty.value = newFilters.selectedActualDifficulty || "";
    selectedVisibility.value = newFilters.selectedVisibility || "";
  },
  { deep: true }
);

watch(
  () => props.archives,
  (newArchives) => {
    if (newArchives && newArchives.length > 0) {
      emit("filtered", filteredArchives.value);
    }
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    if (props.archives.length > 0) {
      emit("filtered", filteredArchives.value);
    }
  });
});

onUnmounted(() => {
  const scrollY = document.body.style.top;
  safeModifyBodyStyles(() => {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.height = "auto";
  });
  protectFloatingButtonPosition();
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
  }
});
</script>