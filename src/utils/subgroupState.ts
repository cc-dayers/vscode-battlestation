export const getSubgroupCollapseKey = (
  groupName: string,
  groupByField: string,
  subGroupName: string
): string => `${groupName}::${groupByField}::${subGroupName}`;