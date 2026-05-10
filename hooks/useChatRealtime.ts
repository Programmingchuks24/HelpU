import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useChatRealtime = (myId: string | null, onNewMessage: (payload: any) => void) => {
  useEffect(() => {
    if (!myId) return;

    // Use a single, stable channel name for the user
    const channel = supabase.channel(`user_messages_${myId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // We don't filter in the channel here to avoid complex filter strings
        },
        (payload) => {
          // Filter the data locally in the callback
          if (payload.new.receiver_id === myId || payload.new.sender_id === myId) {
            onNewMessage(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, onNewMessage]); // Only resets if your User ID or callback changes
};