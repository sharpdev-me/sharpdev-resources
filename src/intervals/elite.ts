import { updateData } from "../elite/data";

function startInterval() {
    return setInterval(updateData, 1000 * 60 * 15);
}

export default startInterval;