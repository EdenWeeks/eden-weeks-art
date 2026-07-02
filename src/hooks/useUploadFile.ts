import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';

import { useCurrentUser } from "./useCurrentUser";

export function useUploadFile() {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        throw new Error('Must be logged in to upload files');
      }

      // Comma-separated list in VITE_BLOSSOM_SERVERS. Default: the family
      // Blossom server (where Eden's artwork already lives), then primal.
      // Entries are normalized to https://…/ so bare hostnames work too.
      const servers = (import.meta.env.VITE_BLOSSOM_SERVERS as string | undefined)
        ?.split(',')
        .map((server) => server.trim())
        .filter(Boolean)
        .map((server) => {
          const withScheme = /^https?:\/\//i.test(server) ? server : `https://${server}`;
          return withScheme.endsWith('/') ? withScheme : `${withScheme}/`;
        }) ?? ['https://blossom.weeksfamily.me/', 'https://blossom.primal.net/'];

      const uploader = new BlossomUploader({
        servers,
        signer: user.signer,
      });

      const tags = await uploader.upload(file);
      return tags;
    },
  });
}