import React, { useEffect, useState } from 'react';
import Me from '../api/Me';
import Event from '../api/Event';
import { EventStateEnum, UserGroupPermissionEnum } from '../utils/types';
import { InfoCircleOutlined, CommentOutlined } from '@ant-design/icons';
import { Badge, Card, List, Tag, Typography } from 'antd';
import EventOption from '../api/EventOption';
import EventOptionCard from './EventOptionCard';
import EventModal from './EventModal';
import Group from '../api/Group';
import User from '../api/User';
import EventChatModal from './EventChatModal';
import { colorMap, getKeyByEnumValue } from '../utils/tools';

interface EventCardProps {
    me: Me;
    event: Event;
    mePermissions: UserGroupPermissionEnum[];
    group: Group;
    members: User[];
    onDelete: (deletedEvent: Event) => void;
}



const EventCard: React.FC<EventCardProps> = ({ me, event, mePermissions, group, members, onDelete }) =>  {
    const [descriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);
    const [eventModalVisible, setEventModalVisible] = useState<boolean>(false);
    const [eventChatModalVisible, setEventChatModalVisible] = useState<boolean>(false);
    const [currentEvent, setCurrentEvent] = useState<Event>(event);
    const [isNew, setIsNew] = useState<boolean>(false);

    useEffect(() => {
        setCurrentEvent(event); 
        const differenceInDays = Math.ceil((Date.now() - event.created.getTime()) / (1000 * 60 * 60 * 24));
        setIsNew(!(differenceInDays > 7 || event.state !== EventStateEnum.VOTING));
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

    const onSetEventOption = (event_option_id:number) => {
        currentEvent.choosen_event_option_id = event_option_id
        setCurrentEvent(currentEvent)
    }

    return (
        <div>
            <Badge
                count={isNew ? "New" : 0}
                className='newBadge'
                style={{ backgroundColor: '#52c41a', paddingRight:"4px", paddingLeft:"4px", display:"unset"}}
            >
            <Card 
                title={<span style={{fontWeight:"700"}}>{event.title}</span>}
                extra={<><Tag
                    color={`${colorMap[event.state]}`}
                    style={{ marginInlineEnd: 4, color:'#000', fontSize:"14px", fontWeight:"500" }}
                >
                    {getKeyByEnumValue(EventStateEnum, event.state)}
                </Tag><Typography.Link onClick={() => {setEventChatModalVisible(true)}} style={{marginRight:"10px"}}><CommentOutlined style={{ fontSize: '18px' }}/></Typography.Link><Typography.Link onClick={handleOpenEventModal}><InfoCircleOutlined style={{ fontSize: '18px' }}/></Typography.Link>  </>}
                style={{ borderTopWidth:'5px', borderTopColor:`#${event.color}`, color:"#333" }}
            >
                <div style={{height:"360px", maxHeight:"360px", overflow:"hidden"}}>
                    <div style={{ overflowY: 'auto', maxHeight:"100%"}}>
                        <Typography.Paragraph
                            ellipsis={{
                                rows: 2,
                                expandable: 'collapsible',
                                expanded: descriptionExpanded,
                                onExpand: (_, info) => setDescriptionExpanded(info.expanded),
                            }}
                        >
                            {event.description}
                        </Typography.Paragraph>
                    </div>
                    {!descriptionExpanded && (
                        <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '5px' }}>
                            <List
                                grid={{
                                    xs: 1,
                                    sm: 1,
                                    md: 1,
                                    lg: 1,
                                    xl: 1,
                                    xxl: 1,
                                }}
                                dataSource={currentEvent.event_options ? currentEvent.event_options : []}
                                renderItem={(event_option: EventOption) => (
                                    <List.Item key={event_option.id}>
                                        {currentEvent.choosen_event_option_id !== null && event_option.id === currentEvent.choosen_event_option_id ? (
                                            <Badge.Ribbon text="Chosen" color="#108ee9" placement="start">
                                                <EventOptionCard me={me} onSet={(event_option_id)=>{onSetEventOption(event_option_id)}} event_option={event_option} mePermissions={mePermissions} members={members} event_state={currentEvent.state}/>
                                            </Badge.Ribbon>
                                        ) : (
                                            <EventOptionCard me={me} onSet={(event_option_id)=>{onSetEventOption(event_option_id)}} event_option={event_option} mePermissions={mePermissions} members={members} event_state={currentEvent.state}/>
                                        )}
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}
                </div>
            </Card>
            </Badge>
            <EventModal me={me} mePermissions={mePermissions} event={event} visible={eventModalVisible} onFinish={handleFinishEvent} onDelete={handleDeleteEvent} onCancel={handleCloseEventModal} group={group} members={members}/>
            <EventChatModal me={me} mePermissions={mePermissions} event={event} visible={eventChatModalVisible} onFinish={()=>{setEventChatModalVisible(false)}} onCancel={()=>{setEventChatModalVisible(false)}} group={group} members={members}/>
        </div>
    );
};


export default EventCard;
