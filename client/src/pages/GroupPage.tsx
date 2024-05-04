import React, { useState, useEffect } from 'react';
import { Button, Tabs } from 'antd';
import User from '../api/User';
import Invite from '../api/Invites';
import Group from '../api/Group';
import Me from '../api/Me';
import { UserGroupPermissionEnum } from '../utils/types';
import Loading from '../components/Loading';
import Vote from '../api/Vote';
import Event from '../api/Event';
import UsersGroupPage from './GroupPages/UsersGroupPage';
import InvitesGroupPage from './GroupPages/InvitesGroupPage';
import EventsGroupPage from './GroupPages/EventsGroupPage';
import EventModal from '../components/EventModal';
import VotesGroupPage from './GroupPages/VotesGroupPage';
import VoteModal from '../components/VoteModal';
import OverviewGroupPage from './GroupPages/OverviewGroupPage';
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

    useEffect(() => {
        if(mePermissions === undefined){
            setMePermissions([])
            Me.get_group_permissions(group.id).then((permissionData: UserGroupPermissionEnum[]) => {
                setMePermissions(permissionData);
            });
        }
        if(events === undefined){
            setEvents(null);
            group.get_all_events_for_group().then((eventData: Event[] | null) => {
                setEvents(eventData);
            });
        }   
        if(votes === undefined){
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
        setEventModalVisible(false);
    };

    const handleDeleteEvent = async () => {
        setEventModalVisible(false);
    };

    const handleCloseVoteModal = () => {
        setVoteModalVisible(false);
    };

    const handleFinishVote = (voteData: Vote) => {
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
                defaultActiveKey="1"
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key);
                }}
                tabBarExtraContent={
                    <>
                    {(activeTab === "3" && (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_EVENTS))) && (
                        <Button
                        type="primary"
                        onClick={() => {
                            setEventModalVisible(true);
                        }}
                        >
                        Add Event
                        </Button>
                    )}
                    {(activeTab === "4" && (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_VOTES))) && (
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
                <TabPane tab="Overview" key="1">
                    <OverviewGroupPage me={me} group={group} toDoVotes={meGroupVotes ? meGroupVotes : []} toDoEvents={meGroupEvents ? meGroupEvents : []} calenderEvents={meGroupCalender ? meGroupCalender : []}  members={members ? members : []} mePermissions={mePermissions} />
                </TabPane>
                <TabPane tab="Members" key="2">
                    <UsersGroupPage me={me} group={group} users={users ? users : []} members={members ? members : []} mePermissions={mePermissions}/>
                </TabPane>
                <TabPane tab="Events" key="3">
                    <EventsGroupPage me={me} group={group} events={events ? events : []} members={members ? members : []} mePermissions={mePermissions} />
                </TabPane>
                <TabPane tab="Votes" key="4">
                    <VotesGroupPage me={me} group={group} votes={votes ? votes : []} members={members ? members : []} mePermissions={mePermissions} />
                </TabPane>
                {(me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_INVITES)) &&
                    <TabPane tab="Invites" key="5">
                        <InvitesGroupPage group={group} invites={invites ? invites : []}/>
                    </TabPane>
                }
            </Tabs>
            <EventModal me={me} mePermissions={mePermissions} visible={eventModalVisible} onFinish={handleFinishEvent} onDelete={handleDeleteEvent} onCancel={handleCloseEventModal} group={group} members={members ? members : []}/>
            <VoteModal me={me} mePermissions={mePermissions} visible={voteModalVisible} onFinish={handleFinishVote} onDelete={handleDeleteVote} onCancel={handleCloseVoteModal} group={group} members={members ? members : []}/>
        </div>
    );
};

export default GroupPage;