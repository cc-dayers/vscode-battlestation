export const getSubgroupCollapseKey = (
  groupName: string,
  groupByField: string,
  subGroupName: string
): string => `${groupName}::${groupByField}::${subGroupName}`;

export const getSubgroupHiddenKey = (
  groupByField: string,
  subGroupName: string
): string => `${groupByField}::${subGroupName}`;

export const isSubgroupHidden = (
  group: { hiddenSubGroups?: string[] },
  groupByField: string,
  subGroupName: string
): boolean => {
  return Array.isArray(group.hiddenSubGroups)
    && group.hiddenSubGroups.includes(getSubgroupHiddenKey(groupByField, subGroupName));
};

export const toggleSubgroupHiddenKey = (
  hiddenSubGroups: readonly string[] | undefined,
  groupByField: string,
  subGroupName: string
): string[] => {
  const key = getSubgroupHiddenKey(groupByField, subGroupName);
  const nextHiddenSubGroups = new Set(hiddenSubGroups ?? []);
  if (nextHiddenSubGroups.has(key)) {
    nextHiddenSubGroups.delete(key);
  } else {
    nextHiddenSubGroups.add(key);
  }
  return Array.from(nextHiddenSubGroups);
};