import { find } from 'lodash';

import type { RoleType } from '@/schema/identity/role/type';

import { getDefaultPageAccessPermissionList } from '@/lib/access-control/page-access-helper';
import type { Menu, MenuId } from '@/lib/menu/config';
import { MENU_LIST } from '@/lib/menu/menu-architecture';
import { MENU_INFO_MAP } from '@/lib/menu/menu-info';

import type { PageAccessMenuItem } from '@/services/administration/types/role-type';

const flattenSubMenuList = (subMenuList: Menu[], defaultMenuIds: MenuId[], translationIds?: string[]): PageAccessMenuItem[] => {
    if (!subMenuList) return [];
    let results: PageAccessMenuItem[] = [];
    subMenuList.forEach((subMenu) => {
        if (!subMenu.needPermissionByRole || !defaultMenuIds.includes(subMenu.id)) return;

        const menuInfo = MENU_INFO_MAP[subMenu.id];
        if (subMenu.subMenuList?.length) {
            results = results.concat(flattenSubMenuList(subMenu.subMenuList, defaultMenuIds, [...translationIds || [], menuInfo.translationId]));
        } else {
            results.push({
                id: subMenu.id,
                translationIds: [...translationIds || [], menuInfo.translationId],
                isAccessible: false,
                hideMenu: false,
            });
        }
    });
    return results;
};

export const getPageAccessMenuListByRoleType = (defaultItems: PageAccessMenuItem[] = [], roleType: RoleType): PageAccessMenuItem[] => {
    const results: PageAccessMenuItem[] = [];
    const defaultMenuIdsByRoleType = getDefaultPageAccessPermissionList(roleType);
    MENU_LIST.forEach((menu) => {
        if (menu.needPermissionByRole && defaultMenuIdsByRoleType.includes(menu.id)) {
            const menuInfo = MENU_INFO_MAP[menu.id];
            results.push({
                id: menu.id,
                translationIds: [menuInfo.translationId],
                isAccessible: false,
                hideMenu: false,
                isParent: true,
                subMenuList: flattenSubMenuList(menu?.subMenuList ?? [], defaultMenuIdsByRoleType),
            });
        }
    });
    return defaultItems.concat(results);
};

export const getPageAccessList = (menuItems: PageAccessMenuItem[]): string[] => {
    // all case
    const allItem = find(menuItems, { id: 'all' });
    if (allItem && allItem.isAccessible) return ['*'];

    const results: string[] = [];
    menuItems.forEach((menu) => {
        // accessible permission for menu group
        if (menu.isAccessible) {
            results.push(`${menu.id}.*`);
            return;
        }

        // each individual menu case
        menu.subMenuList?.forEach((subMenu) => {
            if (!subMenu.isAccessible) return;
            results.push(`${menu.id}.${subMenu.id}`);
        });
    });

    return results;
};
