export function getColorFromId(id: number): string {

    const colors = ['#FFC0CB', '#ADD8E6', '#98FB98', '#FFD700', '#FFA07A', '#87CEFA', '#F08080', '#90EE90', '#AFEEEE'];

    const colorIndex = id % colors.length;

    return colors[colorIndex];
};


export {};