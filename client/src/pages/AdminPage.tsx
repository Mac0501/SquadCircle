import React, { useState, useEffect } from 'react';
import Me from '../api/Me';
import User from '../api/User';
import Invite from '../api/Invites';
import UsersAdminPage from './AdminPages/UsersAdminPage';
import Group from '../api/Group';
import GroupsAdminPage from './AdminPages/GroupsAdminPage';
import InvitesAdminPage from './AdminPages/InvitesAdminPage';
import Loading from '../components/Loading';
import CustomTab from '../components/CustomTab';

interface AdminProps {
  me: Me;
}

const Admin: React.FC<AdminProps> = ({ me }) => {
  const [users, setUsers] = useState<User[] | null>(null);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [invites, setInvites] = useState<Invite[] | null>(null);

  useEffect(() => {
    User.get_users().then(setUsers);
    Group.get_groups().then(setGroups);
    Invite.get_invites().then(setInvites);
  }, []);

  const handleUserUpdate = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
  }

  if(users === null || groups === null || invites === null){
    return <Loading/>
  }

  const elements = [
    {
      tabTitle: 'Users',
      path: '/admin/users',
      tabBody: <UsersAdminPage users={users} onUpdate={handleUserUpdate} />
    },
    {
      tabTitle: 'Groups',
      path: '/admin/groups',
      tabBody: <GroupsAdminPage groups={groups} users={users} />
    },
    {
      tabTitle: 'Invites',
      path: '/admin/invites',
      tabBody: <InvitesAdminPage invites={invites} groups={groups} />
    }
  ];

  return (
    <div>
      <CustomTab elements={elements} />
    </div>
  );
};

export default Admin;