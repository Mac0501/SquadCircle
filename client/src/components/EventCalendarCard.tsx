import React, { useEffect, useState } from 'react';
import Me from '../api/Me';
import Event from '../api/Event';
import { UserGroupPermissionEnum } from '../utils/types';
import { InfoCircleOutlined, CommentOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';
import EventModal from './EventModal';
import Group from '../api/Group';
import User from '../api/User';
import EventChatModal from './EventChatModal';
import { displayTime } from '../utils/formatDisplayes';

interface EventCardProps {
    me: Me;
    event: Event;
    mePermissions: UserGroupPermissionEnum[];
    group: Group;
    members: User[];
    onDelete: (deletedEvent: Event) => void;
}



const EventCalendarCard: React.FC<EventCardProps> = ({ me, event, mePermissions, group, members, onDelete }) =>  {
    const [descriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);
    const [eventModalVisible, setEventModalVisible] = useState<boolean>(false);
    const [eventChatModalVisible, setEventChatModalVisible] = useState<boolean>(false);
    const [currentEvent, setCurrentEvent] = useState<Event>(event);

    useEffect(() => {
        setCurrentEvent(event);
    }, [event]);

    const handleOpenEventModal = () => {
        setEventModalVisible(true);
    };

    const handleCloseEventModal = () => {
        setEventModalVisible(false);
    };

    const handleFinishEvent = (eventData: Event) => {
        setCurrentEvent(eventData);
        setEventModalVisible(false);
    };

    const handleDeleteEvent = async () => {
        await event.delete();
        setEventModalVisible(false);
        onDelete(event);
    };

    return (
        <div>
            <Card 
                style={{ borderLeftWidth:'5px', borderLeftColor:`#${currentEvent.color}` }}>
                <div style={{position:"absolute", top:"0", right:"0", padding:"5px"}}><><Typography.Link onClick={() => {setEventChatModalVisible(true)}} style={{marginRight:"10px"}}><CommentOutlined style={{ fontSize: '18px' }}/></Typography.Link><Typography.Link onClick={handleOpenEventModal}><InfoCircleOutlined style={{ fontSize: '18px' }}/></Typography.Link>  </></div>
                <div style={{ display: "flex", flexDirection:"column", alignItems: "start", justifyContent: "start", height:"100%", width:"100%" }}>
                    <h3 style={{ margin: "0px", width:"100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {currentEvent.title}
                    </h3>
                    <span>{currentEvent.choosen_event_option ? displayTime(currentEvent.choosen_event_option?.start_time) : ""} {currentEvent.choosen_event_option?.end_time && ` - ${displayTime(currentEvent.choosen_event_option?.end_time)}`}</span>
                    <div style={{ overflowY: 'auto', maxHeight:"100%"}}>
                        <Typography.Paragraph
                            style={{margin:"0px", whiteSpace:"pre-wrap"}}
                            ellipsis={{
                                rows: 1,
                                expandable: 'collapsible',
                                expanded: descriptionExpanded,
                                onExpand: (_, info) => setDescriptionExpanded(info.expanded),
                            }}
                        >
                            {event.description ? event.description.split('\n')[0] : ""}
                        </Typography.Paragraph>
                    </div>
                </div>
            </Card>
            <EventModal me={me} mePermissions={mePermissions} event={event} visible={eventModalVisible} onFinish={handleFinishEvent} onDelete={handleDeleteEvent} onCancel={handleCloseEventModal} group={group} members={members} editable={false}/>
            <EventChatModal me={me} mePermissions={mePermissions} event={event} visible={eventChatModalVisible} onFinish={()=>{setEventChatModalVisible(false)}} onCancel={()=>{setEventChatModalVisible(false)}} group={group} members={members}/>
        </div>
    );
};


export default EventCalendarCard;
