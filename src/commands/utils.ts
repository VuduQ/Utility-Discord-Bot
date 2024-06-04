import { MessageType } from 'discord.js';
import { AnyInteraction, MessageResponse, GenericMapping } from 'src/types';
import { INTERACTION_MAX_TIMEOUT } from 'src/constants';
import { log, error } from 'src/logging';

type RemoveButtonsOptions = {
  interaction?: AnyInteraction,
  message?: MessageResponse,
};

export async function removeButtons({ interaction, message }: RemoveButtonsOptions): Promise<void> {
  if (!interaction && message && 'edit' in message && message.editable && message.type === MessageType.Default) {
    // This is a channel message (outside of an interaction)
    // Note: Message collectors for non-ephemeral messages like this should probably never stop,
    // but this code is here in the event that they do, for whatever reason.
    await message.edit({
      components: [],
    });
  } else if (interaction && message) {
    // This is a follow-up message to an interaction. We need to use webhook.editMessage to edit the
    // follow-up message as opposed to the first message in the interaction.
    await interaction.webhook.editMessage(message.id, {
      components: [],
    });
  } else if (interaction) {
    await interaction.editReply({
      components: [],
    });
  }
}

type Handler = () => void | Promise<void>;
type Handlers = GenericMapping<Handler>;

type ListenForButtonsOptions = {
  handlers: Handlers,
  cleanupCb?: () => void | Promise<unknown>,
  interaction?: AnyInteraction,
  message?: MessageResponse,
} & ({
  interaction: AnyInteraction,
  message?: undefined,
} | {
  message: MessageResponse,
  interaction?: AnyInteraction,
});

export async function listenForButtons({
  interaction,
  message,
  handlers,
  cleanupCb,
}: ListenForButtonsOptions): Promise<void> {
  const time = interaction
    ? interaction.createdTimestamp + INTERACTION_MAX_TIMEOUT - Date.now()
    : undefined;
  const msgId = message ? message.id : (await interaction?.fetchReply())?.id;
  const channel = interaction
    ? interaction.channel
    : message && 'channel' in message
      ? message.channel
      : null;
  if (!channel) {
    log('Attempted to listen for buttons, but could not find channel.', interaction, message);
  }

  try {
    const collector = channel?.createMessageComponentCollector({
      filter: i => i.message.id === msgId,
      time,
    });
    collector?.on('collect', async i => {
      await i.deferUpdate().catch(() => {
        log('Could not defer update for interaction', i.customId);
      });
      const handler = handlers[i.customId];
      if (handler) {
        handler();
        if (cleanupCb) cleanupCb();
      }
    });
    collector?.on('end', (collected, reason) => {
      log('Ended collection of message components.', 'Reason:', reason);
      removeButtons({ interaction, message }).catch(error);
    });
  } catch (err) {
    log('Entered catch block for player buttons collector.');
    removeButtons({ interaction, message }).catch(error);
  }
}
