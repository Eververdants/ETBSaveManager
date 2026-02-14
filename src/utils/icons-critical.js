/**
 * Critical FontAwesome icons used during initial render.
 * Keep this module small so startup does not load the full icon set.
 */

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCog,
  faCommentDots,
  faDatabase,
  faEdit,
  faEye,
  faEyeSlash,
  faFolder,
  faHome,
  faInfoCircle,
  faList,
  faMagnifyingGlass,
  faMinus,
  faPlus,
  faPlusCircle,
  faSearch,
  faStore,
  faTimes,
  faTrash,
  faWindowMaximize,
} from "@fortawesome/free-solid-svg-icons";

export function registerCriticalIcons() {
  library.add(
    faHome,
    faCog,
    faPlus,
    faStore,
    faInfoCircle,
    faMinus,
    faWindowMaximize,
    faTimes,
    faList,
    faPlusCircle,
    faCommentDots,
    faSearch,
    faMagnifyingGlass,
    faFolder,
    faEdit,
    faEye,
    faEyeSlash,
    faTrash,
    faDatabase
  );
}

export default { registerCriticalIcons };
