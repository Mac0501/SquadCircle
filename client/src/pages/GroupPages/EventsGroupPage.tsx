import React, { useState } from 'react';
import Me from '../../api/Me';
import Group from '../../api/Group';
import Event from '../../api/Event';
import { UserGroupPermissionEnum } from '../../utils/types';
import User from '../../api/User';
import { List } from 'antd';
import EventCard from '../../components/EventCard';

interface EventsGroupPageProps {
    me: Me,
    group: Group,
    events: Event[];
    members: User[];
    mePermissions: UserGroupPermissionEnum[];
}

const EventsGroupPage: React.FC<EventsGroupPageProps> = ({ me, group, events, members, mePermissions }) =>  {
    const [eventsList, setEventsList] = useState<Event[]>(events);

    const handleDeleteEvent = async (deletedEvent: Event) => {
        // Remove the deleted event from the events list
        const updatedEventsList = eventsList.filter(event => event.id !== deletedEvent.id);
        setEventsList(updatedEventsList);
    };

    return (
        <List
            grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 2,
                xl: 3,
                xxl: 3,
            }}
            dataSource={eventsList}
            renderItem={(event: Event) => (
                <List.Item>
                    <EventCard me={me} event={event} mePermissions={mePermissions} group={group} members={members} onDelete={handleDeleteEvent}/>
                </List.Item>
            )}
        />
    );
};

export default EventsGroupPage;
