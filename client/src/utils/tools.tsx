import { EventStateEnum } from "./types";

export function getColorFromId(id: number): string {

    const colors = ['#FFC0CB', '#ADD8E6', '#98FB98', '#FFD700', '#FFA07A', '#87CEFA', '#F08080', '#90EE90', '#AFEEEE'];

    const colorIndex = id % colors.length;

    return colors[colorIndex];
};

export const colorMap: { [key in EventStateEnum]: string } = {
    [EventStateEnum.VOTING]: "#FFEB3B", // Yellow for VOTING
    [EventStateEnum.OPEN]: "#64B5F6",    // Sky Blue for OPEN
    [EventStateEnum.ACTIVE]: "#4CAF50",  // Lime Green for ACTIVE
    [EventStateEnum.CLOSED]: "#78909C",  // Blue Grey for CLOSED
    [EventStateEnum.ARCHIVED]: "#7E57C2" // Purple for ARCHIVED
};


export function getKeyByEnumValue<T extends string | number>(
    enumType: Record<string, T>,
    enumValue: T
): string | undefined {
    const keys = Object.keys(enumType) as (keyof typeof enumType)[];
    for (const key of keys) {
        if (enumType[key] === enumValue) {
            return key;
        }
    }
    return undefined; 
}

export {};