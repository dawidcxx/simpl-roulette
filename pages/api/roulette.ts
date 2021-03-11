// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { getRandomRouletteValue, RouletteGameValue } from "components/games/RouletteGame/RouletteGameValues";
import { NextApiRequest, NextApiResponse } from "next"

export interface ApiError {
  type: 'error',
  error: {
    message: string,
  }
}

export interface RouletteApiResp {
  value: RouletteGameValue,
}

export default (req: NextApiRequest, res: NextApiResponse<RouletteApiResp | ApiError>) => {
  switch (req.method) {
    case 'POST':
      res.send({
        value: getRandomRouletteValue()
      });
      break;
    default:
      res.statusCode = 405;
      res.send({
        type: 'error',
        error: {
          message: 'This method is not allowed'
        }
      })
      break;
  }
}
