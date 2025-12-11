import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/id";

dayjs.locale("id");
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const day = dayjs;

export default day;
