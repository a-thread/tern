import React from 'react';
import { Share } from 'react-native';

import { FootNote, Group, GroupLabel, Row, ToggleRow } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { confirm } from '@shared/utils/confirm';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { fishable, ReportKind } from '@/domain/ternary/models/ternary';
import { useRootNavigation } from '@/navigation/useAppNavigation';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';

/**
 * The ternary's settings: what you share, taking a break without leaving, inviting friends,
 * blocking someone (silently) and leaving. Leaving keeps every waypoint you earned, and the
 * shared bird never moves back.
 */
export default function TernarySettingsScreen() {
  const { ternary, setPrivacy, block, unblock, report, leave } = useTernary();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const root = useRootNavigation();
  if (!ternary) return <TernaryPage title='Ternary settings'>{null}</TernaryPage>;

  const privacy = { flyPrivately: ternary.flyPrivately, shareResting: ternary.shareResting };
  const change = (next: Partial<typeof privacy>) =>
    setPrivacy({ ...privacy, ...next }).catch((e) => {
      console.warn('Could not save ternary privacy', e);
      toast.show('Couldn’t save that just now. Please try again.');
    });

  const invite = () =>
    Share.share({
      message: `Fly with me in Tern: join my ternary “${ternary.name}” with the code ${ternary.inviteCode}.`,
    }).catch(() => {});

  const reportMember = async (userId: string) => {
    try {
      await report(ReportKind.Member, userId);
      toast.show('Thanks. It’s been reported.');
    } catch (e) {
      console.warn('Could not report a member', e);
      toast.show('Couldn’t report that just now. Please try again.');
    }
  };

  const askBlock = (userId: string, name: string) =>
    confirm({
      title: `Block ${name}?`,
      message: `You’ll stop seeing each other in ${ternary.name}. ${name} isn’t told. To report their name to Tern as well, choose Report.`,
      action: 'Block',
      also: { text: 'Report', onPress: () => reportMember(userId) },
      onConfirm: () => block(userId).catch(() => toast.show('Couldn’t block just now.')),
    });

  const askUnblock = (userId: string, name: string) =>
    confirm({
      title: `Unblock ${name}?`,
      message: `You’ll see each other in ${ternary.name} again.`,
      action: 'Unblock',
      destructive: false,
      onConfirm: () => unblock(userId).catch(() => toast.show('Couldn’t unblock just now.')),
    });

  const askLeave = () =>
    confirm({
      title: `Leave ${ternary.name}?`,
      message:
        'You keep every waypoint you’ve earned, and the shared bird keeps the days you flew together. Your fish, postcards and dishes leave with you.',
      action: 'Leave',
      onConfirm: async () => {
        try {
          await leave();
          root.goBack();
        } catch (e) {
          console.warn('Could not leave the ternary', e);
          toast.show('Couldn’t leave just now. Please try again.');
        }
      },
    });

  return (
    <TernaryPage title='Ternary settings'>
      <GroupLabel>What you share</GroupLabel>
      <Group>
        <ToggleRow
          title='Share that I’m resting'
          sub='Otherwise a rest day just shows “Here”'
          on={ternary.shareResting}
          onToggle={(v) => change({ shareResting: v })}
        />
        <ToggleRow
          title='Fly privately'
          sub='You still carry the shared bird, but you’re never drawn in the flock'
          on={ternary.flyPrivately}
          onToggle={(v) => change({ flyPrivately: v })}
        />
      </Group>
      <FootNote>
        Nobody ever sees what you ate, weighed or walked, your streak, or your own
        journey.
      </FootNote>

      <GroupLabel>Taking a break</GroupLabel>
      <Group>
        <ToggleRow
          title='Hide the ternary for now'
          sub='Journey keeps one row to bring it back. Your friends see nothing change'
          on={settings.hideTernary}
          onToggle={(v) => updateSettings({ hideTernary: v })}
        />
      </Group>

      <GroupLabel>Friends</GroupLabel>
      <Group>
        <Row
          title='Invite a friend'
          sub={`Code ${ternary.inviteCode}`}
          chevron
          onPress={invite}
        />
        {fishable(ternary.members).map((m) => (
          <Row
            key={m.userId}
            title={m.name}
            sub='Block or report'
            subLink
            onPress={() => askBlock(m.userId, m.name)}
          />
        ))}
      </Group>
      <FootNote>
        Blocking is silent: they just stop seeing you. A report goes to Tern and is
        read by a person.
      </FootNote>

      {ternary.blocked.length ? (
        <>
          <GroupLabel>Blocked</GroupLabel>
          <Group>
            {ternary.blocked.map((b) => (
              <Row
                key={b.userId}
                title={b.name}
                sub='Unblock'
                subLink
                onPress={() => askUnblock(b.userId, b.name)}
              />
            ))}
          </Group>
        </>
      ) : null}

      <Group>
        <Row title={`Leave ${ternary.name}`} chevron onPress={askLeave} />
      </Group>
    </TernaryPage>
  );
}
