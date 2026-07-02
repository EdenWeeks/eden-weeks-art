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

      // Comma-separated list in VITE_BLOSSOM_SERVERS; primal is the fallback.
      const servers = (import.meta.env.VITE_BLOSSOM_SERVERS as string | undefined)
        ?.split(',')
        .map((server) => server.trim())
        .filter(Boolean) ?? ['https://blossom.primal.net/'];

      const uploader = new BlossomUploader({
        servers,
        signer: user.signer,
      });

      const tags = await uploader.upload(file);
      return tags;
    },
  });
}