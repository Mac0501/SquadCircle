import React, { useState, useEffect, Suspense } from 'react';
import { Button, Tabs } from 'antd';
import User from '../api/User';
import Invite from '../api/Invites';
import Group from '../api/Group';
import Me from '../api/Me';
import { UserGroupPermissionEnum } from '../utils/types';
import Loading from '../components/Loading';
import Vote from '../api/Vote';
import Event from '../api/Event';
import VoteModal from '../components/VoteModal';
import EventModal from '../components/EventModal';
import { useLocation, useNavigate } from 'react-router-dom';
const UsersGroupPage = React.lazy(() => import("./GroupPages/UsersGroupPage"));
const InvitesGroupPage = React.lazy(() => import("./GroupPages/InvitesGroupPage"));
const EventsGroupPage = React.lazy(() => import("./GroupPages/EventsGroupPage"));
const VotesGroupPage = React.lazy(() => import("./GroupPages/VotesGroupPage"));
const OverviewGroupPage = React.lazy(() => import("./GroupPages/OverviewGroupPage"));
const SettingsGroupPage = React.lazy(() => import("./GroupPages/SettingsGroupPage"));
const { TabPane } = Tabs;

  interface GroupProps {
    me: Me;
    group: Group;
  }

  const GroupPage: React.FC<GroupProps> = ({ me, group }) => {
    const [activeTab, setActiveTab] = useState("1");
    const [mePermissions, setMePermissions] = useState<UserGroupPermissionEnum[]>()
    const [members, setMembers] = useState<User[] | null>();
    const [users, setUsers] = useState<User[] | null>();
    const [events, setEvents] = useState<Event[] | null>();
    const [votes, setVotes] = useState<Vote[] | null>();
    const [invites, setInvites] = useState<Invite[] | null>();
    const [meGroupEvents, setMeGroupEvents] = useState<Event[] | null>();
    const [meGroupVotes, setMeGroupVotes] = useState<Vote[] | null>();
    const [meGroupCalender, setMeGroupCalender] = useState<Event[] | null>();
    const [eventModalVisible, setEventModalVisible] = useState<boolean>(false);
    const [voteModalVisible, setVoteModalVisible] = useState<boolean>(false);

    const navigate = useNavigate();
    const location = useLocation();

    const currentPath = location.pathname;

    useEffect(() => {
        if(mePermissions === undefined){
            setMePermissions([])
            Me.get_group_permissions(group.id).then((permissionData: UserGroupPermissionEnum[]) => {
                setMePermissions(permissionData);
            });
        }
        if(group !== undefined && events === undefined){
            setEvents(null);
            group.get_all_events_for_group().then((eventData: Event[] | null) => {
                setEvents(eventData);
            });
        }   
        if(group !== undefined && votes === undefined){
            setVotes(null);
            group.get_all_votes_for_group().then((voteData: Vote[] | null) => {
                setVotes(voteData);
            });
        }
        if(events && meGroupEvents === undefined && meGroupCalender === undefined){
            Me.get_me_group_events(group.id, events ? events : []).then((meGroupEventsData) => {
                setMeGroupEvents(meGroupEventsData.meGroupEvents);
                setMeGroupCalender(meGroupEventsData.meGroupCalender);
            });
        }
        if(votes && meGroupVotes === undefined){
            Me.get_me_group_votes(group.id, votes).then((incompleteVotesData) => {
                setMeGroupVotes(incompleteVotesData);
            });
        }
        if(members === undefined){
            setMembers(null);
            group.get_users().then((membersData: User[] | null) => {
                setMembers(membersData);
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events, group, me.id, votes]);
    
    useEffect(() => {
        if (mePermissions !== undefined) {
            if (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_USERS)) {
                if(users === undefined){
                    setUsers(null);
                    User.get_users().then((userData: User[] | null) => {
                        setUsers(userData);
                    });
                }
            }
            else{
                setUsers(null);
            }
            if (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_INVITES)) {
                if(invites === undefined){
                    setInvites(null);
                    group.get_invites().then((inviteData: Invite[] | null) => {
                        setInvites(inviteData);
                    });
                }
            }
            else{
                setInvites(null);
            }
        }
    }, [group, mePermissions, me.owner, users, invites]);
    

    const handleCloseEventModal = () => {
        setEventModalVisible(false);
    };

    const handleFinishEvent = (eventData: Event) => {
        if (group.events === null){
            const tempEvents = events ? events : []
            setEvents([eventData ,...tempEvents])
        }
        setEventModalVisible(false);
    };

    const handleDeleteEvent = async () => {
        setEventModalVisible(false);
    };

    const handleCloseVoteModal = () => {
        setVoteModalVisible(false);
    };

    const handleFinishVote = (voteData: Vote) => {
        if (group.votes === null){
            const tempVotes = votes ? votes : []
            setVotes([voteData ,...tempVotes])
        }
        setVoteModalVisible(false);
    };

    const handleDeleteVote = async () => {
        setVoteModalVisible(false);
    };


    if(mePermissions === undefined || members === undefined || events === undefined || votes === undefined || invites === undefined || meGroupEvents === undefined || meGroupVotes === undefined){
        return <Loading/>
    }

    return (
        <div>
            <Tabs
                activeKey={currentPath}
                onChange={(path) => {
                    navigate(path);
                    setActiveTab(path);
                }}
                tabBarExtraContent={
                    <>
                    {(activeTab === `/group/${group.id}/events` && (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_EVENTS))) && (
                        <Button
                        type="primary"
                        onClick={() => {
                            setEventModalVisible(true);
                        }}
                        >
                        Add Event
                        </Button>
                    )}
                    {(activeTab === `/group/${group.id}/votes` && (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_VOTES))) && (
                        <Button
                        type="primary"
                        onClick={() => {
                            setVoteModalVisible(true);
                        }}
                        >
                        Add Vote
                        </Button>
                    )}
                    </>
                }
                >            
                <TabPane tab="Overview" key={`/group/${group.id}`}>
                    <Suspense fallback={<div></div>}>
                        <OverviewGroupPage me={me} group={group} toDoVotes={meGroupVotes ? meGroupVotes : []} toDoEvents={meGroupEvents ? meGroupEvents : []} calenderEvents={meGroupCalender ? meGroupCalender : []}  members={members ? members : []} mePermissions={mePermissions} />
                    </Suspense>
                </TabPane>
                <TabPane tab="Members" key={`/group/${group.id}/members`}>
                    <Suspense fallback={<div></div>}>
                        <UsersGroupPage me={me} group={group} users={users ? users : []} members={members ? members : []} mePermissions={mePermissions}/>
                    </Suspense>
                </TabPane>
                <TabPane tab="Events" key={`/group/${group.id}/events`}>
                    <Suspense fallback={<div></div>}>
                        <EventsGroupPage me={me} group={group} events={events ? events : []} members={members ? members : []} mePermissions={mePermissions} />
                    </Suspense>
                </TabPane>
                <TabPane tab="Votes" key={`/group/${group.id}/votes`}>
                    <Suspense fallback={<div></div>}>
                        <VotesGroupPage me={me} group={group} votes={votes ? votes : []} members={members ? members : []} mePermissions={mePermissions} />
                    </Suspense>
                </TabPane>
                {(me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_INVITES)) &&
                    <TabPane tab="Invites" key={`/group/${group.id}/invites`}>
                        <Suspense fallback={<div></div>}>
                            <InvitesGroupPage group={group} invites={invites ? invites : []}/>
                        </Suspense>
                    </TabPane>
                }
                <TabPane tab="Settings" key={`/group/${group.id}/settings`}>
                    <Suspense fallback={<div></div>}>
                        <SettingsGroupPage me={me} group={group} mePermissions={mePermissions} />
                    </Suspense>
                </TabPane>
            </Tabs>
            <EventModal me={me} mePermissions={mePermissions} visible={eventModalVisible} onFinish={handleFinishEvent} onDelete={handleDeleteEvent} onCancel={handleCloseEventModal} group={group} members={members ? members : []}/>
            <VoteModal me={me} mePermissions={mePermissions} visible={voteModalVisible} onFinish={handleFinishVote} onDelete={handleDeleteVote} onCancel={handleCloseVoteModal} group={group} members={members ? members : []}/>
        </div>
    );
};

export default GroupPage;
