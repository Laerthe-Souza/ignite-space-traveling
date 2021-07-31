import { NextApiRequest, NextApiResponse } from 'next';

export default async function ExitPrismicPreview(
  request: NextApiRequest,
  response: NextApiResponse
): Promise<void> {
  response.clearPreviewData();

  response.writeHead(307, { Location: '/' });

  return response.end();
}
