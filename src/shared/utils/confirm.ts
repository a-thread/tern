import { Alert } from 'react-native';

/** Red unless `destructive` is false; `also` adds a middle choice ("Open Google Play"). */
export function confirm({
  title,
  message,
  action,
  onConfirm,
  destructive = true,
  cancel = 'Cancel',
  also,
}: {
  title: string;
  message: string;
  /** The confirming button: "Delete", "Remove", "Replace". */
  action: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
  cancel?: string;
  also?: { text: string; onPress: () => void | Promise<void> };
}) {
  Alert.alert(title, message, [
    { text: cancel, style: 'cancel' },
    ...(also ? [{ text: also.text, onPress: also.onPress }] : []),
    {
      text: action,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
