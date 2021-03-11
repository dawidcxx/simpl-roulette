import axios from "axios";
import { RouletteApiResp } from "pages/api/roulette";

export const rouletteService = {
    async getRoll(): Promise<RouletteApiResp> {
        const resp = await axios.post<RouletteApiResp>('/api/roulette');
        return resp.data;
    }
};