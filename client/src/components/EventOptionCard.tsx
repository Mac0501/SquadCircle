import React, { useEffect, useState } from 'react';
import Me from '../api/Me';
import { EventOptionResponseEnum, EventStateEnum, UserGroupPermissionEnum } from '../utils/types';
import { CheckCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Card, DatePicker, Modal, Progress, Radio, RadioChangeEvent, Tooltip } from 'antd';
import EventOption from '../api/EventOption';
import User from '../api/User';
import UserEventOptionResponse from '../api/UserEventOptionResponse';
import dayjs from 'dayjs';

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

const EventOptionCard: React.FC<EventOptionCardProps> = ({ me, event_option, mePermissions, editable = false, onSet, onEdit, onDelete, members, event_state }) => {
    const [deleteConfirmVisibleEventOption, setDeleteConfirmVisibleEventOption] = useState<boolean>(false);
    const [editModalVisibleEventOption, setEditModalVisibleEventOption] = useState<boolean>(false);
    const [choosenOption, setChoosenOption] = useState<UserEventOptionResponse|null>(() => {
        const userEventOptionResponse = event_option.user_event_option_responses?.find(response => {
            return response.user_and_group && response.user_and_group.user_id === me.id;
        });
    
        return userEventOptionResponse ? userEventOptionResponse : null;
    });

    const [acceptedCount, setAcceptedCount] = useState<number>(0);
    const [deniedCount, setDeniedCount] = useState<number>(0);

    useEffect(() => {
        // Calculate counts of ACCEPTED and DENIED responses when component mounts
        const accepted = event_option.user_event_option_responses?.filter(response => response.response === EventOptionResponseEnum.ACCEPTED).length || 0;
        const denied = event_option.user_event_option_responses?.filter(response => response.response === EventOptionResponseEnum.DENIED).length || 0;
        setAcceptedCount(accepted);
        setDeniedCount(denied);
    }, [event_option.user_event_option_responses]);

    const updateCounts = () => {
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


    return (
        <div>
            <Card 
                hoverable
                actions={editable ? [ 
                    event_option.id === null ? (
                        <CheckCircleOutlined key="set"/>
                    ) : (
                        <Tooltip title="Set this event option as chosen." trigger="hover">
                            <CheckCircleOutlined key="set" onClick={() => {if(onSet && event_option.id !== null){onSet(event_option.id)}}}/>
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
                        <h1 style={{ marginBottom:"4px" }} >{event_option.date}</h1>
                        <div>{event_option.start_time} {event_option.end_time && ` - ${event_option.end_time}`}</div>
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
                        <Progress success={{ percent: acceptedPercentage, strokeColor:"#52c41a" }} strokeColor="#aaaaaa" trailColor='#f5222d' percent={membersLeftPercentage} type="line" showInfo={false} style={{width:"100%", marginLeft:"5px", marginRight:"5px"}}/>
                        <div>{deniedCount}</div>
                    </div>
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
                onCancel={()=>{setEditModalVisibleEventOption(false);}}
                okButtonProps={{ disabled: !(event_option.end_time === null || dayjs(event_option.start_time, 'HH:mm:ss').isBefore(dayjs(event_option.end_time, 'HH:mm:ss'))) }}
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
                    <DatePicker allowClear={false} picker="time" defaultValue={dayjs(event_option.start_time, 'HH:mm:ss')} onChange={(startTime, startTimeString) => {
                        if (typeof startTimeString === 'string') {
                            event_option.start_time = startTimeString;
                        }
                    }} />
                    </div>
                    <div>
                        <span style={{marginRight:"5px"}}>End Time:</span>
                    <DatePicker allowClear={true}  picker="time" defaultValue={dayjs(event_option.end_time, 'HH:mm:ss')}  onChange={(endTime, endTimeString) => {
                        if (typeof endTimeString === 'string') {
                            if(endTime===null){
                                event_option.end_time = null;
                            }
                            else{
                                event_option.end_time = endTimeString;
                            }
                        }
                    }} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EventOptionCard;
