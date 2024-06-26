import React, { useEffect, useState } from 'react';
import Me from '../../api/Me';
import Group from '../../api/Group';
import { UserGroupPermissionEnum } from '../../utils/types';
import User from '../../api/User';
import Event from '../../api/Event';
import { Badge, Button, Calendar, List, Modal } from 'antd';
import Vote from '../../api/Vote';
import VoteCard from '../../components/VoteCard';
import EventCard from '../../components/EventCard';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarProps, HeaderRender } from 'antd/es/calendar/generateCalendar';
import { displayDate } from '../../utils/formatDisplayes';
import EventCalendarCard from '../../components/EventCalendarCard';

interface OverviewGroupPageProps {
    me: Me,
    group: Group,
    toDoVotes: Vote[];
    toDoEvents: Event[];
    calenderEvents: Event[];
    members: User[];
    mePermissions: UserGroupPermissionEnum[];
}

const OverviewGroupPage: React.FC<OverviewGroupPageProps> = ({ me, group, toDoVotes, toDoEvents, calenderEvents, members, mePermissions }) =>  {
    const [votesList, setVotesList] = useState<Vote[]>(toDoVotes);
    const [eventsList, setEventsList] = useState<Event[]>(toDoEvents);
    const [calendarEvents, setCalendarEvents] = useState<Event[]>(calenderEvents);
    const [dayModalEventList, setDayModalEventList] = useState<Event[]>([]);
    const [dayModalTitle, setDayModalTitle] = useState<string>();
    const [dayModalVisible, setDayModalVisible] = useState<boolean>(false);

    useEffect(() => {
        setVotesList(toDoVotes)
        setEventsList(toDoEvents)
        setCalendarEvents(calenderEvents)
      }, [toDoVotes, toDoEvents, calenderEvents]);

    const handleDeleteVote = async (deletedVote: Vote) => {
        const updatedVotesList = votesList.filter(vote => vote.id !== deletedVote.id);
        setVotesList(updatedVotesList);
    };
    
    const handleDeleteEvent = async (deletedEvent: Event) => {
        const updatedEventsList = eventsList.filter(event => event.id !== deletedEvent.id);
        setEventsList(updatedEventsList);
    };

    const firstDayOfMonth = dayjs().startOf('month');

    // Calculate the last day of the current month
    const lastDayOfMonth = dayjs().endOf('month');

    // Merge votes and events, sort by ID
    const mergedItems = [...votesList, ...eventsList].sort((a, b) => {
        return b.created.getTime() - a.created.getTime();
    });

    const renderEmptyHeader: HeaderRender<dayjs.Dayjs> = ({ value, onChange }) => null;

    const dateCellRender = (value: Dayjs) => {
        const formattedDate = value.format('YYYY-MM-DD');
        const listData = calendarEvents.filter(event => {
            const chosenOption = event.choosen_event_option;
            return chosenOption && dayjs(chosenOption.date).format('YYYY-MM-DD') === formattedDate;
        });
        return (
          <ul className="events">
            {listData.map((event) => (
              <li key={event.id}>
                <Badge color={`#${event.color}`} text={event.title} />
              </li>
            ))}
          </ul>
        );
      };

    const onSelect = (value: Dayjs) => {
        const formattedDate = value.format('YYYY-MM-DD');
        const listData = calendarEvents.filter(event => {
            const chosenOption = event.choosen_event_option;
            return chosenOption && dayjs(chosenOption.date).format('YYYY-MM-DD') === formattedDate;
        });
        if (listData.length > 0){
            setDayModalEventList(listData)
            setDayModalTitle(formattedDate)
            setDayModalVisible(true)
        }
    };

    const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
        if (info.type === 'date') return dateCellRender(current);
        if (info.type === 'month') return null;
        return info.originNode;
    };

    return (
        <div>
        {mergedItems.length > 0 && ( // Check if mergedItems has items
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
                style={{marginBottom:"25px"}}
                dataSource={mergedItems}
                renderItem={(item: Vote | Event) => (
                    <List.Item>
                        {/* Render VoteCard if item is a Vote */}
                        {item instanceof Vote && (
                            <VoteCard
                                me={me}
                                vote={item}
                                mePermissions={mePermissions}
                                group={group}
                                members={members}
                                onDelete={handleDeleteVote} // Pass handleDeleteVote function
                            />
                        )}
                        {/* Render EventCard if item is an Event */}
                        {item instanceof Event && (
                            <EventCard
                                me={me}
                                event={item}
                                mePermissions={mePermissions}
                                group={group}
                                members={members}
                                onDelete={handleDeleteEvent} // Pass handleDeleteEvent function
                            />
                        )}
                    </List.Item>
                )}
            />
        )}
        <div style={{borderRadius:"15px", backgroundColor:"#141414", padding:"5px", marginBottom:"10px"}}>
            <Calendar validRange={[firstDayOfMonth,lastDayOfMonth]} headerRender={renderEmptyHeader} cellRender={cellRender} onSelect={onSelect}/>
        </div>
        <Modal
              title={displayDate(dayModalTitle ? dayModalTitle: "")}
              open={dayModalVisible}
              onOk={() => setDayModalVisible(false)}
              onCancel={() => setDayModalVisible(false)}
              footer={
                <div style={{ display: 'flex', justifyContent:'end' }}>
                    <Button type="primary" onClick={() => setDayModalVisible(false)} key="submit">
                        Close
                    </Button>
                </div>
                }
          >
            <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'clip', padding: '5px' }}>
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
                    dataSource={dayModalEventList}
                    renderItem={(event: Event) => (
                        <List.Item>
                            <EventCalendarCard
                                me={me}
                                event={event}
                                mePermissions={mePermissions}
                                group={group}
                                members={members}
                                onDelete={handleDeleteEvent}
                            />
                        </List.Item>
                    )}
                />
            </div>
          </Modal>
    </div>
    );
};

export default OverviewGroupPage;
