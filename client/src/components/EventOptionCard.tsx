import React, { useEffect, useState } from 'react';
import Me from '../api/Me';
import { EventOptionResponseEnum, EventStateEnum, UserGroupPermissionEnum } from '../utils/types';
import { CheckCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Card, DatePicker, Modal, Progress, Radio, RadioChangeEvent, TimePicker, Tooltip, Typography, Button, Collapse } from 'antd';
import EventOption from '../api/EventOption';
import User from '../api/User';
import UserEventOptionResponse from '../api/UserEventOptionResponse';
import dayjs from 'dayjs';
import { displayDate, displayTime } from '../utils/formatDisplayes';
import UserAvatar from './UserAvatar';

interface EventOptionCardProps {
    me: Me,
    event_option: EventOption|EventOptionProp;
    mePermissions: UserGroupPermissionEnum[];
    editable?: boolean;
    onSet?: (id: number) => void;
    onEdit?: (updatedEventOption: EventOptionProp) => void;
    onDelete?: (updatedEventOption: EventOptionProp) => void;
    members: User[];
    event_state: EventStateEnum
}

const optionsWithDisabled = [
    { label: 'Accept', value: EventOptionResponseEnum.ACCEPTED },
    { label: 'Deny', value: EventOptionResponseEnum.DENIED },
];

interface EventOptionProp {
    id: number|null
    date: string;
    start_time: string;
    end_time: string | null;
    event_id: number | null;
    user_event_option_responses: UserEventOptionResponse[] | null;
}

async function create_user_event_option_response(event_option_id: number, response: EventOptionResponseEnum): Promise<UserEventOptionResponse | null> {
    try {
        const fetch_response = await fetch(`/api/event_options/${event_option_id}/user_event_option_response`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ response })
        });
        if (fetch_response.ok) {
            const responseData = await fetch_response.json();
            return UserEventOptionResponse.fromJson(responseData);
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error creating user event option response:', error);
        return null;
    }
}

async function set_for_event(event_option_id:number): Promise<boolean> {
    try {
        const response = await fetch(`/api/event_options/${event_option_id}/set_for_event`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Error setting event option for event:', error);
        return false;
    }
}

const EventOptionCard: React.FC<EventOptionCardProps> = ({ me, event_option, mePermissions, editable = false, onSet, onEdit, onDelete, members, event_state }) => {
    const [deleteConfirmVisibleEventOption, setDeleteConfirmVisibleEventOption] = useState<boolean>(false);
    const [showEventOptionVoteList, setShowEventOptionVoteList] = useState<boolean>(false);
    const [editModalEventOptionOKButton, setEditModalEventOptionOKButton] = useState<boolean>(!(event_option.end_time === null || dayjs(event_option.start_time, 'HH:mm:ss').isBefore(dayjs(event_option.end_time, 'HH:mm:ss'))));
    const [editModalVisibleEventOption, setEditModalVisibleEventOption] = useState<boolean>(false);
    const [choosenOption, setChoosenOption] = useState<UserEventOptionResponse|null>(() => {
        const userEventOptionResponse = event_option.user_event_option_responses?.find(response => {
            return response.user_and_group && response.user_and_group.user_id === me.id;
        });
    
        return userEventOptionResponse ? userEventOptionResponse : null;
    });

    const [acceptedCount, setAcceptedCount] = useState<number>(0);
    const [deniedCount, setDeniedCount] = useState<number>(0)

    const [acceptedMembers, setAcceptedMembers] = useState<User[]>([])
    const [deniedMembers, setDeniedMembers] = useState<User[]>([])
    const [restMembers, setRestMembers] = useState<User[]>([])

    const oldEventOptionData = {date: event_option.date, start_time: event_option.start_time, end_time:event_option.end_time}

    useEffect(() => {
        const acceptedUsers: User[] = [];
        const deniedUsers: User[] = [];
        let restUsers: User[] = []; 

        if (event_option.user_event_option_responses) {
            event_option.user_event_option_responses.forEach(user_event_option_response => {
                if (user_event_option_response.user_and_group === null) return;
        
                const userId = user_event_option_response.user_and_group.user_id;
                const user = members.find(member => member.id === userId);
        
                if (!user) return;
        
                if (user_event_option_response.response === EventOptionResponseEnum.ACCEPTED) {
                    acceptedUsers.push(user);
                } else if (user_event_option_response.response === EventOptionResponseEnum.DENIED) {
                    deniedUsers.push(user);
                }
            });
        
            // Filtering members based on accepted and denied users
            restUsers = members.filter(member => !acceptedUsers.includes(member) && !deniedUsers.includes(member));
        } else {
            restUsers = members;
        }

        setAcceptedMembers(acceptedUsers);
        setDeniedMembers(deniedUsers);
        setRestMembers(restUsers);
        const accepted = event_option.user_event_option_responses?.filter(response => response.response === EventOptionResponseEnum.ACCEPTED).length || 0;
        const denied = event_option.user_event_option_responses?.filter(response => response.response === EventOptionResponseEnum.DENIED).length || 0;
        setAcceptedCount(accepted);
        setDeniedCount(denied);
    }, [event_option.user_event_option_responses, members]);

    const updateCounts = () => {
        const acceptedUsers: User[] = [];
        const deniedUsers: User[] = [];
        let restUsers: User[] = []; 

        if (event_option.user_event_option_responses) {
            event_option.user_event_option_responses.forEach(user_event_option_response => {
                if (user_event_option_response.user_and_group === null) return;
        
                const userId = user_event_option_response.user_and_group.user_id;
                const user = members.find(member => member.id === userId);
        
                if (!user) return;
        
                if (user_event_option_response.response === EventOptionResponseEnum.ACCEPTED) {
                    acceptedUsers.push(user);
                } else if (user_event_option_response.response === EventOptionResponseEnum.DENIED) {
                    deniedUsers.push(user);
                }
            });
        
            // Filtering members based on accepted and denied users
            restUsers = members.filter(member => !acceptedUsers.includes(member) && !deniedUsers.includes(member));
        } else {
            restUsers = members;
        }

        setAcceptedMembers(acceptedUsers);
        setDeniedMembers(deniedUsers);
        setRestMembers(restUsers);
        const accepted = event_option.user_event_option_responses?.filter(response => response.response === EventOptionResponseEnum.ACCEPTED).length || 0;
        const denied = event_option.user_event_option_responses?.filter(response => response.response === EventOptionResponseEnum.DENIED).length || 0;
        setAcceptedCount(accepted);
        setDeniedCount(denied);
    };

    // Calculate percentage of ACCEPTED responses
    const totalResponses = members.length;
    const acceptedPercentage = (acceptedCount / totalResponses) * 100;
    const membersLeftCount = members.length - (acceptedCount + deniedCount);
    const membersLeftPercentage = ((acceptedCount + membersLeftCount) / totalResponses) * 100;

    const tomorrow = dayjs().add(1, 'day');

    const onChooseOption = async ({ target: { value } }: RadioChangeEvent) => {
        if (event_option.id !== null) {
            let updatedOption: UserEventOptionResponse | null;
            if (choosenOption === null) {
                const new__user_event_option_response = await create_user_event_option_response(event_option.id!, value);
                if (new__user_event_option_response !== null) {
                    setChoosenOption(new__user_event_option_response);
                    event_option.user_event_option_responses = event_option.user_event_option_responses !== null ? event_option.user_event_option_responses : [] 
                    event_option.user_event_option_responses?.push(new__user_event_option_response);
                    updateCounts();
                }
            } else {
                await choosenOption.update(value);
                updatedOption = choosenOption
                if (updatedOption !== null) {
                    setChoosenOption(updatedOption);
                    updateCounts();
                }
            }
        }
    };

    const onCheckOption = async () =>{
        if (event_option.id !== null){
            const worked = await set_for_event(event_option.id)
            if(onSet && event_option.id !== null && worked){onSet(event_option.id)}
        }
    }

    const disabledTime = (now: dayjs.Dayjs) => {
        const startTime = dayjs(event_option.start_time, 'HH:mm:ss');
    
        // Disable hours from 0 to the current hour
        const disabledHours = () => {
            const hours = [];
            const startHour = startTime.hour();
            for (let i = 0; i < startHour; i++) {
                hours.push(i);
            }
            return hours;
        }
    
        // Disable minutes if the hour is the current hour
        const disabledMinutes = (selectedHour: number) => {
            if (selectedHour === startTime.hour()) {
                const minutes = [];
                const startMinute = startTime.minute();
                for (let i = 0; i < startMinute; i++) {
                    minutes.push(i);
                }
                return minutes;
            }
            // Return an empty array if minutes are not disabled
            return [];
        }
    
        return {
            disabledHours,
            disabledMinutes,
        };
    };
    

    return (
        <div>
            <Card
                actions={editable ? [ 
                    event_option.id === null ? (
                        <CheckCircleOutlined key="set"/>
                    ) : (
                        <Tooltip title="Set this event option as chosen." trigger="hover">
                            <CheckCircleOutlined key="set" onClick={() => {onCheckOption()}}/>
                        </Tooltip>
                    ),
                    <Tooltip title="Edit this event option." trigger="hover">
                        <EditOutlined key="edit" onClick={()=>{setEditModalVisibleEventOption(true)}}/>
                    </Tooltip>,
                    <Tooltip title="Delete event option." trigger="hover">
                        <DeleteOutlined key="delete" onClick={()=>{setDeleteConfirmVisibleEventOption(true)}}/>
                    </Tooltip>
                ] : []}
            >
                <div style={{ display: "flex", flexDirection:"column", alignItems: "center", justifyContent: "center", height:"100%" }}>
                    <div style={{ display: "flex", flexDirection:"column", flex: 1, alignItems:"center", justifyContent:"center" }}>
                        <h1 style={{ marginBottom:"4px" }} >{displayDate(event_option.date)}</h1>
                        <div>{displayTime(event_option.start_time)} {event_option.end_time && ` - ${displayTime(event_option.end_time)}`}</div>
                    </div>
                    <div style={{ display: "flex", flex: 1, height:"100%", alignItems:"center", justifyContent:"center", marginTop:"16px" }}>
                        <Radio.Group
                            disabled={(event_option.id === null || event_state !== EventStateEnum.VOTING)}
                            options={optionsWithDisabled}
                            onChange={onChooseOption}
                            value={choosenOption?.response}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection:"row", flex: 1, alignItems:"center", justifyContent:"center", width:"100%" }}>
                        <div>{acceptedCount}</div>
                        <Progress success={{ percent: acceptedPercentage, strokeColor:"#52c41a" }} strokeColor="#313131" trailColor='#f44' percent={membersLeftPercentage} type="line" showInfo={false} style={{width:"100%", marginLeft:"5px", marginRight:"5px"}}/>
                        <div>{deniedCount}</div>
                    </div>
                    <Typography.Link onClick={()=> {setShowEventOptionVoteList(true)}}>Show votes</Typography.Link>
                </div>
            </Card>
            <Modal
                title="Confirm Delete"
                open={deleteConfirmVisibleEventOption}
                onOk={() => { setDeleteConfirmVisibleEventOption(false); if(onDelete){onDelete(event_option);} }}
                onCancel={()=>{setDeleteConfirmVisibleEventOption(false);}}
            >
                Are you sure you want to delete this Event-Option?
            </Modal>
            <Modal
                title="Event-Option"
                open={editModalVisibleEventOption}
                onOk={() => { 
                    if (onEdit) {
                        const updatedEventOption: EventOptionProp = {
                            ...event_option,
                        };
                        onEdit(updatedEventOption);
                    }
                    setEditModalVisibleEventOption(false);
                }}
                onCancel={()=>{setEditModalVisibleEventOption(false); event_option.date = oldEventOptionData.date; event_option.start_time = oldEventOptionData.start_time; event_option.end_time = oldEventOptionData.end_time;}}
                okButtonProps={{ disabled: editModalEventOptionOKButton }}
            >
                <div style={{ display: "flex", flexDirection:"column", alignItems: "start", justifyContent: "start", height:"100%", gap:'10px' }}>
                    <div>
                        <span style={{marginRight:"5px"}}>Date:</span>
                        <DatePicker allowClear={false} defaultValue={dayjs(event_option.date, 'YYYY-MM-DD')} minDate={tomorrow} onChange={(date, dateString) => {
                            if (typeof dateString === 'string') {
                                event_option.date = dateString;
                            }
                        }} />
                    </div>
                    <div>
                        <span style={{marginRight:"5px"}}>Start Time:</span>
                        <TimePicker allowClear={false} changeOnScroll needConfirm={false} showNow={false} defaultValue={dayjs(event_option.start_time, 'HH:mm:ss')} format={'HH:mm'} onChange={(startTime, startTimeString) => {
                            if (typeof startTimeString === 'string') {
                                event_option.start_time = `${startTimeString}:00`;
                            }
                            setEditModalEventOptionOKButton(!(event_option.end_time === null || dayjs(event_option.start_time, 'HH:mm:ss').isBefore(dayjs(event_option.end_time, 'HH:mm:ss'))))
                        }} />
                    </div>
                    <div>
                        <span style={{marginRight:"5px"}}>End Time:</span>
                        <TimePicker
                            allowClear
                            changeOnScroll
                            needConfirm={false}
                            showNow={false}
                            defaultValue={
                                event_option.end_time !== null
                                    ? dayjs(event_option.end_time, 'HH:mm:ss')
                                    : null
                            }
                            format="HH:mm"
                            onChange={(endTime, endTimeString) => {
                                if (typeof endTimeString === 'string') {
                                    event_option.end_time = endTime !== null ? `${endTimeString}:00` : null;
                                }
                                setEditModalEventOptionOKButton(!(event_option.end_time === null || dayjs(event_option.start_time, 'HH:mm:ss').isBefore(dayjs(event_option.end_time, 'HH:mm:ss'))))
                            }}
                            disabledTime={(date) => disabledTime(date)}
                        />
                    </div>
                </div>
            </Modal>
            <Modal
                title="Votes"
                open={showEventOptionVoteList}
                onOk={() => {setShowEventOptionVoteList(false)}}
                onCancel={()=>{setShowEventOptionVoteList(false);}}
                footer={
                    <div style={{ display: 'flex', justifyContent:'end' }}>
                        <Button type="primary" onClick={() => setShowEventOptionVoteList(false)} key="submit">
                            Close
                        </Button>
                    </div>
                    }
            >
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight:"50vh", overflowY: 'auto', overflowX: 'clip', padding:"5px"}}>
                    <Collapse defaultActiveKey={['1','2','3']} ghost>
                        <Collapse.Panel header={<span style={{color:"#52c41a", fontWeight: 'bold', fontSize: '16px'}} >Accepted</span>} key="1">
                            {acceptedMembers.length > 0 ? (
                                <div style={{padding:"5px"}}>
                                    {acceptedMembers.map(acceptedMember => {
                                        return (<div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }} key={acceptedMember.id}>
                                            <div style={{width:"30px"}}>
                                                <UserAvatar user={acceptedMember} size={30} />
                                            </div>
                                            <span style={{ marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acceptedMember.name}</span>
                                        </div>)
                                    })}
                                </div>
                            ) : ("Nobody accepted yet.")}
                        </Collapse.Panel>
                        <Collapse.Panel header={<span style={{color:"#f44", fontWeight: 'bold', fontSize: '16px'}} >Denied</span>} key="2">
                            {deniedMembers.length > 0 ? (
                                <div style={{padding:"5px"}}>
                                    {deniedMembers.map(deniedMember => {
                                        return (<div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }} key={deniedMember.id}>
                                            <div style={{width:"30px"}}>
                                                <UserAvatar user={deniedMember} size={30} />
                                            </div>
                                            <span style={{ marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deniedMember.name}</span>
                                        </div>)
                                    })}
                                </div>
                            ) : ("Nobody denied yet.")}
                        </Collapse.Panel>
                        <Collapse.Panel header={<span style={{fontWeight: 'bold', fontSize: '16px'}} >Didn't Vote</span>} key="3">
                            {restMembers.length > 0 ? (
                                <div style={{padding:"5px"}}>
                                    {restMembers.map(restMember => {
                                        return (<div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }} key={restMember.id}>
                                            <div style={{width:"30px"}}>
                                                <UserAvatar user={restMember} size={30} />
                                            </div>
                                            <span style={{ marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{restMember.name}</span>
                                        </div>)
                                    })}
                                </div>
                            ) : ("Everyone has Voted")}
                        </Collapse.Panel>
                    </Collapse>
                </div>
            </Modal>
        </div>
    );
};

export default EventOptionCard;
