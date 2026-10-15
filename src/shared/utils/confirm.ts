import { Alert } from 'react-native';

/**
 * Asks before something that is hard to undo (or that overwrites). The action button is red unless
 * `destructive` is false; `cancel` names the way out ("Keep editing" when leaving a form).
 */
export function confirm({
  title,
  message,
  action,
  onConfirm,
  destructive = true,
  cancel = 'Cancel',
}: {
  title: string;
  message: string;
  /** The confirming button: "Delete", "Remove", "Replace". */
  action: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
  cancel?: string;
}) {
  Alert.alert(title, message, [
    { text: cancel, style: 'cancel' },
    {
      text: action,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
