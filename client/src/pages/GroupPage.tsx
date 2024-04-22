import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
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
const { TabPane } = Tabs;

  interface GroupProps {
    me: Me;
    group: Group;
  }

  interface UserEventsResponse  {
    incomplete_events: Event[];
    other_events: Event[];
  }

  interface UserVotesResponse  {
    incomplete_votes: Event[];
    other_votes: Event[];
  }

  const GroupPage: React.FC<GroupProps> = ({ me, group }) => {
    const [mePermissions, setMePermissions] = useState<UserGroupPermissionEnum[]>()
    const [members, setMembers] = useState<User[] | null>();
    const [users, setUsers] = useState<User[] | null>();
    const [events, setEvents] = useState<Event[] | null>();
    const [votes, setVotes] = useState<Vote[] | null>();
    const [invites, setInvites] = useState<Invite[] | null>();
    const [meGroupEvents, setMeGroupEvents] = useState<UserEventsResponse | null>();
    const [meGroupVotes, setMeGroupVotes] = useState<UserVotesResponse | null>();

    useEffect(() => {
        group.get_group_user_permissions(me.id).then((permissionData: UserGroupPermissionEnum[]) => {
            setMePermissions(permissionData);
        });
        Me.get_me_group_events(group.id).then((meGroupEventsData: UserEventsResponse | null) => {
            setMeGroupEvents(meGroupEventsData);
        });
        Me.get_me_group_votes(group.id).then((meGroupVotesData: UserVotesResponse | null) => {
            setMeGroupVotes(meGroupVotesData);
        });
        group.get_users().then((membersData: User[] | null) => {
            setMembers(membersData);
        });
    }, [group, me.id]);
    
    useEffect(() => {
        if (mePermissions !== undefined) {
            if (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_USERS)) {
                User.get_users().then((userData: User[] | null) => {
                    setUsers(userData);
                });
            }
            else{
                setUsers(null);
            }
            if (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_EVENTS)) {
                group.get_all_events_for_group().then((eventData: Event[] | null) => {
                    setEvents(eventData);
                });
            }
            else{
                setEvents(null);
            }
            if (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_VOTES)) {
                group.get_all_votes_for_group().then((voteData: Vote[] | null) => {
                    setVotes(voteData);
                });
            }
            else{
                setVotes(null);
            }
            if (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_INVITES)) {
                group.get_invites().then((inviteData: Invite[] | null) => {
                    setInvites(inviteData);
                });
            }
            else{
                setInvites(null);
            }
        }
    }, [group, mePermissions, me.owner]);
    

    if(mePermissions === undefined || members === undefined || events === undefined || votes === undefined || invites === undefined || meGroupEvents === undefined || meGroupVotes === undefined){
        return <Loading/>
    }

    return (
        <div>
        <Tabs defaultActiveKey="1">
            <TabPane tab="Overview" key="1">
                <div>lol</div>
            </TabPane>
            <TabPane tab="Members" key="2">
                <UsersGroupPage me={me} group={group} users={users ? users : []} members={members ? members : []} mePermissions={mePermissions}/>
            </TabPane>
            {(me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_EVENTS)) &&
                <TabPane tab="Events" key="3">
                    <div>lol</div>
                </TabPane>
            }
            {(me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_VOTES)) &&
                <TabPane tab="Votes" key="4">
                    <div>lol</div>
                </TabPane>
            }
            {(me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_INVITES)) &&
                <TabPane tab="Invites" key="5">
                    <InvitesGroupPage group={group} invites={invites ? invites : []}/>
                </TabPane>
            }
        </Tabs>
        </div>
    );
};

export default GroupPage;
