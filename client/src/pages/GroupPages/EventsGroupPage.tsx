import React, {  useEffect, useState } from 'react';
import Me from '../../api/Me';
import Group from '../../api/Group';
import Event from '../../api/Event';
import { EventColorEnum, EventStateEnum, UserGroupPermissionEnum } from '../../utils/types';
import User from '../../api/User';
import { Col, Input, List, Row, Select, Tag } from 'antd';
import EventCard from '../../components/EventCard';
import { SearchOutlined } from '@ant-design/icons';
import type { SelectProps } from 'antd';
import { colorMap } from '../../utils/tools';

interface EventsGroupPageProps {
    me: Me,
    group: Group,
    events: Event[];
    members: User[];
    mePermissions: UserGroupPermissionEnum[];
}

interface SearchProps {
    text: string|null
    eventStatus: EventStateEnum[]
    eventColor: string[]
}

const normalizeSearchValues = (values: any): SearchProps => {
    return {
        text: typeof values.text === 'string' ? values.text : null,
        eventStatus: Array.isArray(values.eventStatus) && values.eventStatus.every((status: EventStateEnum) => Object.values(EventStateEnum).includes(status)) ? values.eventStatus : [],
        eventColor: Array.isArray(values.eventColor) && values.eventColor.every((color: string) => typeof color === 'string') ? values.eventColor : []
    };
};

type TagRender = SelectProps['tagRender'];

const tagRenderColor: TagRender = (props) => {
    const { label, value, closable, onClose } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };
    return (
        <Tag
            color={`#${value}`}
            onMouseDown={onPreventMouseDown}
            closable={closable}
            onClose={onClose}
            style={{ marginInlineEnd: 4, color:`#${value}` }}
        >
            {label}
        </Tag>
    );
};

const tagRenderState: TagRender = (props) => {
    const { label, value, closable, onClose } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };
    return (
        <Tag
            color={`${colorMap[value as EventStateEnum]}`}
            onMouseDown={onPreventMouseDown}
            closable={closable}
            onClose={onClose}
            style={{ marginInlineEnd: 4, color:'#000', fontSize:"14px", fontWeight:"500" }}
        >
            {label}
        </Tag>
    );
};

const EventsGroupPage: React.FC<EventsGroupPageProps> = ({ me, group, events, members, mePermissions }) =>  {
    const [eventsList, setEventsList] = useState<Event[]>([]);
    const [searchValues, setSearchValues] = useState<SearchProps>(() => {
        const storedSearchValues = localStorage.getItem('searchValues');
        if (storedSearchValues) {
            try {
                const parsedValues: any = JSON.parse(storedSearchValues);
                return normalizeSearchValues(parsedValues);
            } catch (e) {
                console.error("Invalid search values in localStorage", e);
            }
        }
        return { text: null, eventStatus: [], eventColor: [] };
    });

    // Update eventsList when events prop change
    useEffect(() => {
        setEventsList(events);
    }, [events]);

    useEffect(() => {
        localStorage.setItem('searchValues', JSON.stringify(searchValues));
    }, [searchValues]);

    useEffect(() => {
        filterEvents();
    }, [events, searchValues]);

    const filterEvents = () => {
        let filteredEvents = events;

        if (searchValues.text && searchValues.text.length > 0) {
            filteredEvents = filteredEvents.filter(event =>
                event.title.toLowerCase().includes(searchValues.text!.toLowerCase())
            );
        }

        if (searchValues.eventStatus.length > 0) {
            filteredEvents = filteredEvents.filter(event =>
                searchValues.eventStatus.includes(event.state)
            );
        }

        if (searchValues.eventColor.length > 0) {
            filteredEvents = filteredEvents.filter(event =>
                searchValues.eventColor.includes(event.color)
            );
        }

        setEventsList(filteredEvents);
    };
    
    const handleDeleteEvent = async (deletedEvent: Event) => {
        // Remove the deleted event from the events list
        const updatedEventsList = eventsList.filter(event => event.id !== deletedEvent.id);
        setEventsList(updatedEventsList);
    };

    return (
        <>
        <Row gutter={16} style={{paddingBottom:"10px"}}>
            <Col className="gutter-row" xs={24} sm={12} md={8} lg={6} style={{paddingBottom:"8px"}}>
                <Input
                    value={searchValues.text !== null ? searchValues.text : ""}
                    placeholder="Search"
                    style={{width:"100%"}}
                    suffix={<SearchOutlined />}
                    onChange={(e)=>{setSearchValues({...searchValues, text:e.target.value})}}
                />
            </Col>
            <Col className="gutter-row" xs={24} sm={12} md={8} lg={6} style={{paddingBottom:"8px"}}>
                <Select
                    style={{ width: "100%" }}
                    value={searchValues.eventStatus}
                    maxTagCount='responsive'
                    mode="multiple"
                    tagRender={tagRenderState}
                    allowClear
                    placeholder="Please select"
                    onChange={(value) => setSearchValues({ ...searchValues, eventStatus: value })}
                >
                    {Object.entries(EventStateEnum)
                        .filter(([key, value]) => isNaN(Number(key))) // Filter out numeric keys
                        .map(([key, value]) => (
                            <Select.Option key={key} value={value} style={{ backgroundColor: `${colorMap[value as EventStateEnum]}`, color:"#000", fontSize:"14px", fontWeight:"500"}}>
                                {key.toLowerCase().replace('_', ' ')}
                            </Select.Option>
                        ))}
                </Select>
            </Col>
            <Col className="gutter-row" xs={24} sm={12} md={8} lg={6} style={{paddingBottom:"8px"}}>
                <Select
                    style={{width:"100%"}}
                    value={searchValues.eventColor}
                    maxTagCount='responsive'
                    mode="multiple"
                    tagRender={tagRenderColor}
                    allowClear
                    placeholder="Please select"
                    onChange={(value) => setSearchValues({ ...searchValues, eventColor: value })}
                >
                    {Object.entries(EventColorEnum).map(([key, value]) => (
                        <Select.Option key={key} value={`${value}`} style={{ backgroundColor: `#${value}`, color: `#${value}`, marginTop:"1px", marginBottom:"1px" }}>
                            {value.toLowerCase().replace('_', ' ')}
                        </Select.Option>
                    ))}
                </Select>
            </Col>
        </Row>
        {eventsList.length > 0 && (
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
                pagination={{ pageSize: 24, showSizeChanger: false}}
                style={{marginBottom:"20px"}}
                dataSource={eventsList}
                renderItem={(event: Event) => (
                    <List.Item>
                        <EventCard me={me} event={event} mePermissions={mePermissions} group={group} members={members} onDelete={handleDeleteEvent}/>
                    </List.Item>
                )}
            />
        )}
        </>
    );
};

export default EventsGroupPage;
