import React from 'react';

import {
  FootNote,
  Group,
  GroupLabel,
  Row,
  ToggleRow,
} from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { confirm } from '@shared/utils/confirm';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import {
  fishable,
  ReportKind,
  takenLooks,
} from '@/domain/ternary/models/ternary';
import { useRootNavigation } from '@/navigation/useAppNavigation';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import { LookChoice } from '../components/LookChoice/LookChoice';
import { LeaveRow } from './components/LeaveRow/LeaveRow';
import { useInvite } from '../hooks/useInvite';

/**
 * The ternary's settings: the bird you fly as, what you share, taking a break without leaving, inviting friends,
 * blocking someone (silently) and leaving. Leaving keeps every waypoint you earned, and the
 * shared bird never moves back.
 */
export default function TernarySettingsScreen() {
  const { ternary, setPrivacy, setLook, block, unblock, report, leave } =
    useTernary();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const root = useRootNavigation();
  const invite = useInvite();
  if (!ternary)
    return <TernaryPage title='Ternary settings'>{null}</TernaryPage>;

  const privacy = {
    flyPrivately: ternary.flyPrivately,
    shareResting: ternary.shareResting,
  };
  const change = (next: Partial<typeof privacy>) =>
    setPrivacy({ ...privacy, ...next }).catch((e) => {
      console.warn('Could not save ternary privacy', e);
      toast.show('Couldn’t save that just now. Please try again.');
    });

  const yourLook = ternary.members.find((m) => m.you)?.look ?? 0;
  const chooseLook = (look: number) => {
    if (look === yourLook) return;
    setLook(look)
      .then((changed) => {
        // Taken by someone you can't see here, or chosen at the same moment.
        if (!changed) toast.show('A friend already flies that bird.');
      })
      .catch((e) => {
        console.warn('Could not change your bird', e);
        toast.show('Couldn’t change your bird just now. Please try again.');
      });
  };

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
      onConfirm: () =>
        block(userId).catch(() => toast.show('Couldn’t block just now.')),
    });

  const askUnblock = (userId: string, name: string) =>
    confirm({
      title: `Unblock ${name}?`,
      message: `You’ll see each other in ${ternary.name} again.`,
      action: 'Unblock',
      destructive: false,
      onConfirm: () =>
        unblock(userId).catch(() => toast.show('Couldn’t unblock just now.')),
    });

  // The server deletes a ternary its last member leaves; someone you blocked still counts.
  const alone = ternary.members.length === 1 && ternary.blocked.length === 0;
  const askLeave = () =>
    confirm({
      title: alone ? `Delete ${ternary.name}?` : `Leave ${ternary.name}?`,
      message: alone
        ? 'You’re the only one in it, so leaving deletes it for good. You keep every waypoint you’ve earned.'
        : 'You keep every waypoint you’ve earned, and the shared bird keeps the days you flew together. The fish, postcards and meals you sent leave with you, and so do the fish brought to you.',
      action: alone ? 'Leave and delete' : 'Leave',
      onConfirm: async () => {
        try {
          await leave();
          // Out of the ternary's screens entirely, back to Journey.
          root.navigate('Tabs', { screen: 'Journey' });
        } catch (e) {
          console.warn('Could not leave the ternary', e);
          toast.show('Couldn’t leave just now. Please try again.');
        }
      },
    });

  return (
    <TernaryPage title='Ternary settings'>
      <GroupLabel>Your bird</GroupLabel>
      <LookChoice
        value={yourLook}
        onChange={chooseLook}
        taken={takenLooks(ternary.members)}
      />

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
        Nobody ever sees what you ate, weighed or walked, your streak, or how
        far your own tern has flown.
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
        Blocking is silent: they just stop seeing you. A report goes to Tern and
        is read by a person.
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

      <LeaveRow name={ternary.name} alone={alone} onPress={askLeave} />
    </TernaryPage>
  );
}
