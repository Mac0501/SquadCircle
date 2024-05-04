import { Badge, Button, DatePicker, List, Modal, Select, Typography } from "antd";
import { useEffect, useState } from "react";
import Event from "../api/Event";
import EventOption from "../api/EventOption";
import EventOptionCard from "./EventOptionCard";
import Me from "../api/Me";
import { EventColorEnum, EventStateEnum, UserGroupPermissionEnum } from "../utils/types";
import Group from "../api/Group";
import UserEventOptionResponse from "../api/UserEventOptionResponse";
import User from "../api/User";
import dayjs from 'dayjs';

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

const EventModal: React.FC<EventModalProps> = ({ me, mePermissions, visible, onFinish, onDelete, onCancel, event, group, members }) => {
    const [descriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);
    const [deleteConfirmVisibleEvent, setDeleteConfirmVisibleEvent] = useState<boolean>(false);
    const [createModalVisibleEventOption, setCreateModalVisibleEventOption] = useState<boolean>(false);
    const [editEvent, setEditEvent] = useState<EventProps>({ id: null, title: null, color: EventColorEnum.SEA_GREEN, vote_end_date: null, state: null, group_id: null, description: null, choosen_event_option_id:null, event_options: [], updated_event_options: [], remove_event_options: []});
    const [createEventOption, setCreateEventOption] = useState<EventOptionProp>({ id: null, date: dayjs().add(1, 'day').format('YYYY-MM-DD'), start_time:"12:00:00", end_time: null, event_id:event ? event.id : null, user_event_option_responses:[]});
    const [changed, setChanged] = useState<boolean>(event === undefined);
    const allowedToEdit = (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_EVENTS));

    const tomorrow = dayjs().add(1, 'day');

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
        let newEvent: Event | null;
        if(editEvent.title !== null && editEvent.color !== null){
            if(event===undefined){
                newEvent = await group.create_event_for_group(editEvent.title, editEvent.color, EventStateEnum.VOTING, editEvent.description)
            }
            else{
                await event.update({
                    title: editEvent.title,
                    color: editEvent.color,
                    description: editEvent.description
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
    
    return (
        <div>
            <Modal
                title="Event"
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {changed ? (
                                <div>
                                    <Button onClick={handleCancel} key="back" style={{marginRight:'5px'}}>
                                        Cancel
                                    </Button>
                                    <Button type="primary" onClick={handleFinish} key="submit" disabled={(editEvent.title === null || editEvent.title.length === 0 || editEvent.event_options.length === 0)}>
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
                <Typography.Paragraph
                    style={{margin:'0px'}}
                    ellipsis={{
                        rows: 4,
                        expandable: 'collapsible',
                        expanded: descriptionExpanded,
                        onExpand: (_, info) => setDescriptionExpanded(info.expanded),
                    }}
                    { ...(allowedToEdit ? { editable: { 
                                            onChange: (description:string) => {
                                                setChanged(true);
                                                setEditEvent({ ...editEvent, description })
                                            },
                                            enterIcon: null,
                                            maxLength:2000,
                                        } } : {}) }
                >
                    {editEvent ? editEvent.description : ''}
                </Typography.Paragraph>
                
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
                <div style={{ maxHeight: '300px', overflowY: 'scroll', overflowX: 'clip', padding: '5px' }}>
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
                                            onSet={(id:number)=> setEditEvent({...editEvent, choosen_event_option_id: id})} 
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
                                        onSet={(id:number)=> setEditEvent({...editEvent, choosen_event_option_id: id})} 
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
                okButtonProps={{ disabled: !(createEventOption.end_time === null || dayjs(createEventOption.start_time, 'HH:mm:ss').isBefore(dayjs(createEventOption.end_time, 'HH:mm:ss'))) }}
            >
                <div style={{ display: "flex", flexDirection:"column", alignItems: "start", justifyContent: "start", height:"100%", gap:'10px' }}>
                    <div>
                        <span style={{marginRight:"5px"}}>Date:</span>
                        <DatePicker allowClear={false} defaultValue={dayjs(createEventOption.date, 'YYYY-MM-DD')} minDate={tomorrow} onChange={(date, dateString) => {
                            if (typeof dateString === 'string') {
                                createEventOption.date = dateString;
                            }
                        }} />
                    </div>
                    <div>
                        <span style={{marginRight:"5px"}}>Start Time:</span>
                    <DatePicker allowClear={false} picker="time" defaultValue={dayjs(createEventOption.start_time, 'HH:mm:ss')} onChange={(startTime, startTimeString) => {
                        if (typeof startTimeString === 'string') {
                            createEventOption.start_time = startTimeString;
                        }
                    }} />
                    </div>
                    <div>
                        <span style={{marginRight:"5px"}}>End Time:</span>
                    <DatePicker allowClear={true}  picker="time" defaultValue={dayjs(createEventOption.end_time, 'HH:mm:ss')}  onChange={(endTime, endTimeString) => {
                        if (typeof endTimeString === 'string') {
                            if(endTime===null){
                                createEventOption.end_time = null;
                            }
                            else{
                                createEventOption.end_time = endTimeString;
                            }
                        }
                    }} />
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
