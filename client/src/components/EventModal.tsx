import { Badge, Button, DatePicker, Input, List, Modal, Select, Tag, TimePicker, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import Event from "../api/Event";
import EventOption from "../api/EventOption";
import EventOptionCard from "./EventOptionCard";
import Me from "../api/Me";
import { EventColorEnum, EventStateEnum, UserGroupPermissionEnum } from "../utils/types";
import { EditOutlined } from '@ant-design/icons';
import Group from "../api/Group";
import UserEventOptionResponse from "../api/UserEventOptionResponse";
import User from "../api/User";
import dayjs from 'dayjs';
import { colorMap, getKeyByEnumValue } from "../utils/tools";

interface EventModalProps {
    me: Me,
    mePermissions: UserGroupPermissionEnum[],
    visible: boolean;
    onFinish: (values: Event) => void;
    onDelete: () => void;
    onCancel: () => void;
    event?: Event;
    group: Group;
    members: User[];
    editable?: boolean;
}

interface EventProps {
    id: number|null;
    title: string|null;
    color: string;
    vote_end_date: string|null;
    state: EventStateEnum|null;
    group_id: number|null;
    description: string|null;
    choosen_event_option_id: number|null;
    event_options: EventOptionProp[];
    updated_event_options: number[];
    remove_event_options: number[];
}

interface EventOptionProp {
    id: number|null
    date: string;
    start_time: string;
    end_time: string | null;
    event_id: number | null;
    user_event_option_responses: UserEventOptionResponse[] | null;
}

const EventModal: React.FC<EventModalProps> = ({ me, mePermissions, visible, onFinish, onDelete, onCancel, event, group, members, editable = true }) => {
    const [descriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);
    const [isOverflowing, setIsOverflowing] = useState<boolean>(true);
    const [finishingModalEvent, setFinishingModalEvent] = useState<boolean>(false);
    const [deleteConfirmVisibleEvent, setDeleteConfirmVisibleEvent] = useState<boolean>(false);
    const [createModalVisibleEventOption, setCreateModalVisibleEventOption] = useState<boolean>(false);
    const [editEvent, setEditEvent] = useState<EventProps>({ id: null, title: null, color: EventColorEnum.SEA_GREEN, vote_end_date: null, state: null, group_id: null, description: null, choosen_event_option_id:null, event_options: [], updated_event_options: [], remove_event_options: []});
    const [createEventOption, setCreateEventOption] = useState<EventOptionProp>({ id: null, date: dayjs().add(1, 'day').format('YYYY-MM-DD'), start_time:"12:00:00", end_time: null, event_id:event ? event.id : null, user_event_option_responses:[]});
    const [editModalEventOptionOKButton, setEditModalEventOptionOKButton] = useState<boolean>(!(createEventOption.end_time === null || dayjs(createEventOption.start_time, 'HH:mm:ss').isBefore(dayjs(createEventOption.end_time, 'HH:mm:ss'))));
    const [changed, setChanged] = useState<boolean>(event === undefined);
    const allowedToEdit = (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_EVENTS)) && editable;
    const [isEditing, setIsEditing] = useState(false);
    const textAreaRef = useRef<any>(null);
    const descriptionRef = useRef<any>(null);

    const tomorrow = dayjs().add(1, 'day');
    const now = dayjs();

    useEffect(() => {
        const checkOverflow = () => {
            if (descriptionRef.current) {
                setIsOverflowing(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
            }
        };
        // Check overflow when description content changes
        checkOverflow();
    }, [descriptionRef, descriptionExpanded, editEvent.description]);

    useEffect(() => {
        if (event) {
            setEditEvent({
                id: event.id,
                title: event.title,
                color: event.color,
                vote_end_date: event.vote_end_date,
                state: event.state,
                group_id: event.group_id,
                description: event.description,
                choosen_event_option_id: event.choosen_event_option_id,
                event_options: event.event_options ? event.event_options : [],
                updated_event_options: [],
                remove_event_options: []
            });
        }
        else{
            setEditEvent({ id: null,
                title: null,
                color: EventColorEnum.SEA_GREEN,
                vote_end_date: null,
                state: null,
                group_id: null,
                description: null,
                choosen_event_option_id:null,
                event_options: [],
                updated_event_options: [],
                remove_event_options: []
            });
        }
    }, [event]);

    const customeSetEditEvent = () => {
        if (event) {
            setEditEvent({
                id: event.id,
                title: event.title,
                color: event.color,
                vote_end_date: event.vote_end_date,
                state: event.state,
                group_id: event.group_id,
                description: event.description,
                choosen_event_option_id: event.choosen_event_option_id,
                event_options: event.event_options ? event.event_options : [],
                updated_event_options: [],
                remove_event_options: []
            });
        }
        else{
            setEditEvent({ id: null,
                title: null,
                color: EventColorEnum.SEA_GREEN,
                vote_end_date: null,
                state: null,
                group_id: null,
                description: null,
                choosen_event_option_id:null,
                event_options: [],
                updated_event_options: [],
                remove_event_options: []
            });
        }
    }

    const handleFinish = async() => {
        setFinishingModalEvent(true)
        let newEvent: Event | null;
        if(editEvent.title !== null && editEvent.color !== null){
            if(event===undefined){
                newEvent = await group.create_event_for_group(editEvent.title, editEvent.color, EventStateEnum.VOTING, editEvent.description)
            }
            else{
                await event.update({
                    title: editEvent.title,
                    color: editEvent.color,
                    vote_end_date: editEvent.vote_end_date,
                    description: editEvent.description,
                });
                newEvent = new Event(
                    event.id,
                    event.title,
                    event.color,
                    event.vote_end_date,
                    event.created,
                    event.state,
                    event.group_id,
                    event.description,
                    event.choosen_event_option_id,
                    []
                );
            }
            newEvent!.event_options = []
            if (newEvent !== null){
                for (const event_option of editEvent.event_options) {
                    let newEventOption: EventOption | null;
                    if (event_option.id === null) {
                        newEventOption = await newEvent!.create_event_option_for_event(event_option.date, event_option.start_time, event_option.end_time)
                    } else {
                        newEventOption = new EventOption(event_option.id,event_option.date,event_option.start_time,event_option.end_time,event_option.event_id? event_option.event_id : newEvent.id,event_option.user_event_option_responses)
                        if (newEventOption) {
                            newEvent!.event_options?.push(newEventOption);
                        }
                    }
                }
                for (const remove_event_option_id of editEvent.remove_event_options) {
                    const removeEventOption = event!.event_options?.find(option => option.id === remove_event_option_id);
                    newEvent.event_options = newEvent.event_options!.filter(option => option.id !== remove_event_option_id);
                    if (removeEventOption) {
                        await removeEventOption.delete();
                    }
                }

                for (const updated_event_option_id of editEvent.updated_event_options) {
                    const updatedEventOption = newEvent.event_options?.find(option => option.id === updated_event_option_id);
                    if(updatedEventOption){
                        await updatedEventOption.update({date: updatedEventOption.date,
                                                        start_time: updatedEventOption.start_time,
                                                        end_time: updatedEventOption.end_time})
                    }

                }
                onFinish(newEvent);
                if(!event){
                    customeSetEditEvent()
                }
            }  
        }
        setFinishingModalEvent(false)
    };

    const handleCancel = () =>{
        onCancel()
        customeSetEditEvent()
        setCreateEventOption({ id: null, date: dayjs().add(1, 'day').format('YYYY-MM-DD'), start_time:"12:00:00", end_time: null, event_id:event ? event.id : null, user_event_option_responses:[]})

    }

    const handleCreateEventOption = () => {
        setChanged(true);
        const updatedEventOptions = [...editEvent.event_options];
    
        // Add the new event option to the copied array
        updatedEventOptions.push(createEventOption);
        
        // Update the editEvent state with the new event options array
        setEditEvent({
            ...editEvent,
            event_options: updatedEventOptions
        });

        setCreateEventOption({ id: null, date: dayjs().add(1, 'day').format('YYYY-MM-DD'), start_time:"12:00:00", end_time: null, event_id:event ? event.id : null, user_event_option_responses:[]})
    };

    const handleDeleteEventOption = (deletedEventOption:EventOptionProp, index: number) => {
        setChanged(true);
        if(deletedEventOption.id !== null){
            const filteredEventOptions = editEvent.event_options.filter(option => option.id !== deletedEventOption.id);
            setEditEvent({
                ...editEvent,
                event_options: filteredEventOptions,
                remove_event_options: [...editEvent.remove_event_options, deletedEventOption.id],
                updated_event_options: editEvent.updated_event_options.filter(id => id !== deletedEventOption.id)
            });
        }
        else{
            const filteredEventOptions = editEvent.event_options.filter((option, idx) =>
                idx !== index
            );
            setEditEvent({
                ...editEvent,
                event_options: filteredEventOptions
            });
        }
    };

    const handleUpdateEventOption = (updatedEventOption: EventOptionProp, index: number) => {
        setChanged(true);
        if (updatedEventOption.id !== null) {
            const updatedEventOptions = editEvent.event_options.map(option =>
                option.id === updatedEventOption.id ? updatedEventOption : option
            );
            setEditEvent({
                ...editEvent,
                event_options: updatedEventOptions,
                updated_event_options: Array.from(new Set([...editEvent.updated_event_options, updatedEventOption.id]))
            });
        } else {
            const updatedEventOptions = [...editEvent.event_options];
            updatedEventOptions[index] = updatedEventOption;
            setEditEvent({
                ...editEvent,
                event_options: updatedEventOptions
            });
        }
    };


    const disabledTime = (now: dayjs.Dayjs) => {
        const startTime = dayjs(createEventOption.start_time, 'HH:mm:ss');
    
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
    

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (textAreaRef.current.resizableTextArea.textArea !== event.target) {
                setIsEditing(false);
            }
        };

        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [isEditing]);

    return (
        <div>
            <Modal
                title={
                    <>
                        <span style={{ paddingRight: "10px" }}>Event</span>
                        {editEvent.state !== null && (
                            <Tag
                                color={`${colorMap[editEvent.state]}`}
                                style={{ marginInlineEnd: 4, color: '#000', fontSize: "14px", fontWeight: "500" }}
                            >
                                {getKeyByEnumValue(EventStateEnum, editEvent.state)}
                            </Tag>
                        )}
                    </>
                }
                width="900px"
                open={visible}
                onCancel={handleCancel}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            {(allowedToEdit && event) && (
                                <Button danger onClick={()=>{setDeleteConfirmVisibleEvent(true)}} type="primary">
                                    Delete
                                </Button>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end'}}>
                            {changed ? (
                                <div>
                                    <Button onClick={handleCancel} key="back" style={{marginRight:'5px'}}>
                                        Cancel
                                    </Button>
                                    <Button type="primary" onClick={handleFinish} key="submit" disabled={(editEvent.title === null || editEvent.title.length === 0 || editEvent.event_options.length === 0)} loading={finishingModalEvent}>
                                        Save
                                    </Button>
                                </div>
                            ) : (
                                <Button type="primary" onClick={handleCancel} key="submit">
                                    Close
                                </Button>
                            )}
                        </div>
                    </div>
                }
            >
                <div style={{marginTop:'24px', marginBottom:'12px'}}>
                <Typography.Title
                    level={3}
                    style={{margin:'0px'}}
                    { ...(allowedToEdit ? { editable: { 
                                            onChange: (title:string) => {
                                                setChanged(true);
                                                setEditEvent({ ...editEvent, title: title })
                                            },
                                            enterIcon: null,
                                            maxLength:100,
                                        } } : {}) }
                >
                    {editEvent ? editEvent.title : ''}
                </Typography.Title>
                </div>
                    {isEditing ? (
                        <div>
                            <Input.TextArea
                                ref={textAreaRef}
                                placeholder="Description"
                                autoSize={{ minRows: 1, maxRows: 4 }}
                                maxLength={2000}
                                value={editEvent.description ? editEvent.description : ''}
                                onChange={(e)=>{
                                    setChanged(true);
                                    setEditEvent({ ...editEvent, description:e.target.value })
                                }}
                                style={{ whiteSpace: 'pre-line' }}
                            />
                        </div>
                    ) : (
                        null
                    )}
                    <div style={{position:"relative", display: isEditing ? "none" : "block"}}>
                            <div
                                ref={el => { console.log(el); descriptionRef.current = el; }}
                                style={{
                                    overflow: 'hidden',
                                    maxHeight: descriptionExpanded ? 'none' : '6em',
                                    lineHeight: '1.5em',
                                    display: '-webkit-box',
                                    WebkitLineClamp: descriptionExpanded ? 'unset' : '4', // Number of lines to show
                                    WebkitBoxOrient: 'vertical',
                                    wordBreak: 'break-word',
                                    textOverflow: 'ellipsis',
                                    whiteSpace:"pre-line",
                                    
                                }}
                            >
                                {allowedToEdit ? (
                                    <Typography.Link onClick={() => setIsEditing(true)} style={{ marginRight: "10px" }}>
                                        <EditOutlined />
                                    </Typography.Link>
                                ) : null}{editEvent.description ? editEvent.description : "Description"}
                            </div>
                            {(isOverflowing || descriptionExpanded) && (
                                <a style={{ display: "inline-flex" }} onClick={() => { setDescriptionExpanded(!descriptionExpanded) }}>
                                    {descriptionExpanded ? 'Show Less...' : 'Show More...'}
                                </a>
                            )}
                        </div>
                <div style={{display:'flex', alignItems:'center', marginBottom: '10px', marginTop: '5px'}}>
                    <span>Event Color:</span>
                    <Select
                        defaultValue={editEvent.color}
                        value={editEvent.color}
                        style={{ width: 'auto', marginLeft:'5px'}}
                        disabled={!allowedToEdit}
                        onChange={(color: string) => {
                                setChanged(true);
                                setEditEvent({ ...editEvent, color })
                            }}
                        labelRender={(option) => (
                            <div style={{ color: '#FFFFFF00', backgroundColor: `#${option.value}`, borderRadius:'100%', width:'28px', height:'28px', marginTop:'2px', marginBottom:'2px', boxSizing:'border-box'}}></div>
                        )}
                    >
                        {Object.entries(EventColorEnum).map(([key, value]) => (
                            <Select.Option key={key} value={value} style={{ backgroundColor: `#${value}`, color: `#${value}`, marginTop:"1px", marginBottom:"1px" }}>
                                {value.toLowerCase().replace('_', ' ')}
                            </Select.Option>
                        ))}
                    </Select>
                </div>
                <div style={{display:'flex', alignItems:'center', marginBottom: '10px', marginTop: '5px'}}>
                    <span>Vote End-Date:</span>
                    <DatePicker 
                        needConfirm={false}
                        style={{ width: 'auto', marginLeft:'5px'}}
                        format='YYYY-MM-DD HH:mm'
                        showTime={{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }}
                        allowClear={true} 
                        showNow={false}
                        defaultValue={
                            editEvent.vote_end_date !== null
                                ? dayjs(editEvent.vote_end_date, 'YYYY-MM-DD HH:mm:ss')
                                : null
                        }
                        onChange={(vote_end_date, vote_end_dateString) => {
                            if (typeof vote_end_dateString === 'string') {
                                setChanged(true);
                                editEvent.vote_end_date = vote_end_date !== null ? `${vote_end_dateString}:00` : null;
                            }
                        }}/>
                </div>
                {allowedToEdit && (
                    <Button onClick={()=>{
                            setCreateEventOption({ id: null, date: dayjs().add(1, 'day').format('YYYY-MM-DD'), start_time:"12:00:00", end_time: null, event_id:event ? event.id : null, user_event_option_responses:[]});
                            setCreateModalVisibleEventOption(true);
                        }} 
                        type="primary" 
                        style={{marginBottom:'5px'}}
                    >
                        Add Event-Option
                    </Button>
                )}
                <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'clip', padding: '5px' }}>
                    <List
                        grid={{
                            gutter: 16,
                            xs: 1,
                            sm: 1,
                            md: 1,
                            lg: 1,
                            xl: 1,
                            xxl: 1,
                        }}
                        dataSource={editEvent ? editEvent.event_options ? editEvent.event_options : [] : []}
                        renderItem={(event_option: EventOptionProp, index: number) => (
                            <List.Item>
                                {editEvent.choosen_event_option_id !== null && event_option.id === editEvent.choosen_event_option_id ? (
                                    <Badge.Ribbon text="Chosen" color="#108ee9" placement="start">
                                        <EventOptionCard
                                            key={index} 
                                            me={me}
                                            onSet={(id:number)=> {setEditEvent({...editEvent, choosen_event_option_id: id}); if(event){event.choosen_event_option_id = id}}} 
                                            onEdit={(editedEventOption:EventOptionProp)=>{handleUpdateEventOption(editedEventOption, index)}}
                                            onDelete={(deletedEventOption:EventOptionProp)=>{handleDeleteEventOption(deletedEventOption, index)}}
                                            event_option={event_option}
                                            mePermissions={mePermissions}
                                            { ...(allowedToEdit ? { editable: true } : {})}
                                            members={members}
                                            event_state={event ? event.state : EventStateEnum.VOTING}/>
                                    </Badge.Ribbon>
                                ) : (
                                    <EventOptionCard
                                        key={index} 
                                        me={me}
                                        onSet={(id:number)=> {setEditEvent({...editEvent, choosen_event_option_id: id}); if(event){event.choosen_event_option_id = id}}} 
                                        onEdit={(editedEventOption:EventOptionProp)=>{handleUpdateEventOption(editedEventOption, index)}}
                                        onDelete={(deletedEventOption:EventOptionProp)=>{handleDeleteEventOption(deletedEventOption, index)}}
                                        event_option={event_option}
                                        mePermissions={mePermissions}
                                        { ...(allowedToEdit ? { editable: true } : {})}
                                        members={members}
                                        event_state={event ? event.state : EventStateEnum.VOTING}/>
                                )}
                            </List.Item>
                        )}
                    />
                </div>
            </Modal>
            <Modal
                title="Create Event-Option"
                open={createModalVisibleEventOption}
                onOk={() => { 
                    handleCreateEventOption();
                    setCreateModalVisibleEventOption(false);
                }}
                onCancel={()=>{setCreateModalVisibleEventOption(false);}}
                okButtonProps={{ disabled: editModalEventOptionOKButton }}
            >
                <div style={{ display: "flex", flexDirection:"column", alignItems: "start", justifyContent: "start", height:"100%", gap:'10px' }}>
                    <div>
                        <span style={{marginRight:"5px"}}>Date:</span>
                        <DatePicker 
                            showNow={false}
                            allowClear={false}
                            defaultValue={dayjs(createEventOption.date, 'YYYY-MM-DD')} 
                            minDate={tomorrow} 
                            onChange={(date, dateString) => {
                                if (typeof dateString === 'string') {
                                    createEventOption.date = dateString;
                                }
                            }}/>
                    </div>
                    <div>
                        <span style={{marginRight:"5px"}}>Start Time:</span>
                        <TimePicker allowClear={false} changeOnScroll needConfirm={false} showNow={false} defaultValue={dayjs(createEventOption.start_time, 'HH:mm:ss')} format={'HH:mm'} onChange={(startTime, startTimeString) => {
                            if (typeof startTimeString === 'string') {
                                createEventOption.start_time = `${startTimeString}:00`;
                            }
                            setEditModalEventOptionOKButton(!(createEventOption.end_time === null || dayjs(createEventOption.start_time, 'HH:mm:ss').isBefore(dayjs(createEventOption.end_time, 'HH:mm:ss'))))
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
                                createEventOption.end_time !== null
                                    ? dayjs(createEventOption.end_time, 'HH:mm:ss')
                                    : null
                            }
                            format="HH:mm"
                            onChange={(endTime, endTimeString) => {
                                if (typeof endTimeString === 'string') {
                                    createEventOption.end_time = endTime !== null ? `${endTimeString}:00` : null;
                                }
                                setEditModalEventOptionOKButton(!(createEventOption.end_time === null || dayjs(createEventOption.start_time, 'HH:mm:ss').isBefore(dayjs(createEventOption.end_time, 'HH:mm:ss'))))
                            }}
                            disabledTime={(date) => disabledTime(date)}
                        />
                    </div>
                </div>
            </Modal>
            <Modal
                title="Confirm Delete"
                open={deleteConfirmVisibleEvent}
                onOk={()=>{onDelete(); setDeleteConfirmVisibleEvent(false)}}
                onCancel={()=>{setDeleteConfirmVisibleEvent(false)}}
            >
                Are you sure you want to delete this event?
            </Modal>
        </div>
    );
};

export default EventModal;
