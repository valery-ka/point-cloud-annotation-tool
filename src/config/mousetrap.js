import Mousetrap from "mousetrap";
import { keyCodes } from "utils/settings";

require("mousetrap/plugins/pause/mousetrap-pause.js");

Mousetrap.addKeycodes(keyCodes());

export default Mousetrap;
