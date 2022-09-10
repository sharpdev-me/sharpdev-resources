import centra from "centra";
import { parse } from "node-html-parser";
import { addEliteData, purgeEliteData } from "../database";

const url = "https://inara.cz/commodities/";

export const maxTime = 86400 * 14;

export const updateData = () => centra(url, "GET").send().then(async v => {
    if(v == undefined || v.statusCode == undefined || !v.statusCode.toString().startsWith("2")) throw new Error("yikers " + v.statusCode);

    const time = Date.now();

    await purgeEliteData(time - maxTime);

    const html = v.body.toString("utf-8");
    const parsed = parse(html);

    const table = parsed.querySelector(".maincon")?.querySelector(".containermain")?.querySelector(".maincontentcontainer")?.querySelector(".maincontent1")?.querySelector(".maintable")?.querySelector("table");
    const body = table?.querySelector("tbody");
    if(!table || !body) throw new Error("yikers table gone");

    const rows = body.querySelectorAll("tr").filter(v => !v.classList.contains("subheader"));

    for (const row of rows) {
        const vals = row.querySelectorAll("td");
        const max_sell = Number(vals[4].innerText.replace(",", "").split(" ")[0]);
        const average_sell = Number(vals[1].innerText.replace(",", "").split(" ")[0]);
        if(max_sell == NaN || average_sell == NaN) continue;
        const name = vals[0].innerText;

        addEliteData({
            name: name,
            max_sell: max_sell,
            average_sell: average_sell,
            time: time
        });
    }
});

export interface Commodity {
    name: string;
    max_sell: number;
    average_sell: number;
    time: number;
}