import React from 'react';
import Me from '../../api/Me';
import Group from '../../api/Group';
import { UserGroupPermissionEnum } from '../../utils/types';
import User from '../../api/User';

interface EventsGroupPageProps {
    me: Me,
    group: Group,
    events: Event[];
    members: User[];
    mePermissions: UserGroupPermissionEnum[];
}


const EventsGroupPage: React.FC<EventsGroupPageProps> = ({ me, group, events, members, mePermissions }) =>  {

    return (
        <div>
        </div>
    );
};

export default EventsGroupPage;
