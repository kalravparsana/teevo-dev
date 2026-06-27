import type { TournamentGroup } from '@/types/entities';

export function isHandicapInGroup(handicap: number, group: TournamentGroup): boolean {
  const minOk = group.minHandicap === null || handicap >= group.minHandicap;
  const maxOk = group.maxHandicap === null || handicap <= group.maxHandicap;
  return minOk && maxOk;
}

export function eligibleGroupsForHandicap(
  groups: TournamentGroup[],
  handicap: number | null,
): TournamentGroup[] {
  if (handicap === null) return groups;
  const matched = groups.filter((g) => isHandicapInGroup(handicap, g));
  return matched.length > 0 ? matched : groups;
}

export function formatGroupLabel(group: TournamentGroup): string {
  const parts = [group.name];
  if (group.minHandicap !== null || group.maxHandicap !== null) {
    if (group.minHandicap !== null && group.maxHandicap !== null) {
      parts.push(`(${group.minHandicap}–${group.maxHandicap} hcp)`);
    } else if (group.minHandicap !== null) {
      parts.push(`(${group.minHandicap}+ hcp)`);
    } else if (group.maxHandicap !== null) {
      parts.push(`(up to ${group.maxHandicap} hcp)`);
    }
  }
  return parts.join(' ');
}
