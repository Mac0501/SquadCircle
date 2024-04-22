import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import Me from '../api/Me';
import User from '../api/User';
import Invite from '../api/Invites';
import UsersAdminPage from './AdminPages/UsersAdminPage';
import Group from '../api/Group';
import GroupsAdminPage from './AdminPages/GroupsAdminPage';
import InvitesAdminPage from './AdminPages/InvitesAdminPage';
import Loading from '../components/Loading';
const { TabPane } = Tabs;

  interface AdminProps {
    me: Me;
  }

  const Admin: React.FC<AdminProps> = ({ me }) => {
    const [users, setUsers] = useState<User[] | null>(null);
    const [groups, setGroups] = useState<Group[] | null>(null);
    const [invites, setInvites] = useState<Invite[] | null>(null);

    useEffect(() => {
        User.get_users().then((usersData: React.SetStateAction<User[] | null>) => {
            setUsers(usersData);
        });
        Group.get_groups().then((groupsData: React.SetStateAction<Group[] | null>) => {
            setGroups(groupsData);
        });
        Invite.get_invites().then((inviteData: React.SetStateAction<Invite[] | null>) => {
            setInvites(inviteData);
        });
      }, []);

    if(users === null || groups === null || invites === null){
        return <Loading/>
    }

    return (
        <div>
        <Tabs defaultActiveKey="1">
            <TabPane tab="Users" key="1">
                <UsersAdminPage users={users}/>
            </TabPane>
            <TabPane tab="Groups" key="2">
                <GroupsAdminPage groups={groups} users={users}/>
            </TabPane>
            <TabPane tab="Invites" key="3">
                <InvitesAdminPage invites={invites} groups={groups}/>
            </TabPane>
        </Tabs>
        </div>
    );
};

export default Admin;
