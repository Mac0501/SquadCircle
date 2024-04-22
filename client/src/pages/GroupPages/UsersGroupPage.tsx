import React, { useState } from 'react';
import { Table, Button, Modal, TableProps, Form, Select, Space, Checkbox } from 'antd';
import User from '../../api/User';
import UserAvatar from '../../components/UserAvatar';
import { UserGroupPermissionEnum } from '../../utils/types';
import Me from '../../api/Me';
import Group from '../../api/Group';

const { Option } = Select;

interface UsersProps {
    me: Me,
    group: Group,
    users: User[];
    members: User[];
    mePermissions: UserGroupPermissionEnum[];
}

interface Member {
    id?: number
    user?: User
    permissions: UserGroupPermissionEnum[];
    add_permissions: UserGroupPermissionEnum[];
    remove_permissions: UserGroupPermissionEnum[];
  }

const UsersGroupPage: React.FC<UsersProps> = ({ me, group, users, members, mePermissions }) => {
    const [removeConfirmVisibleMember, setRemoveConfirmVisibleMember] = useState<boolean>(false);
    const [editModalVisibleMember, setEditModalVisibleMember] = useState<boolean>(false);
    const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
    const [updatedMembers, setUpdatedMembers] = useState<User[]>(members);
    const [selectedMember, setSelectedMember] = useState<Member>({ id: undefined, user: undefined, permissions: [], add_permissions: [], remove_permissions: [] });

    const columns: TableProps<User>['columns'] = [
        {
            title: 'Avatar',
            key: 'avatar',
            align: 'center',
            width: 25,
            render: (text: string, record: User) => <UserAvatar key={record.id} user={record} size={35}/>
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            
        },
        {
            title:() => (
                <Button type="primary" onClick={handleAddModalOpenMember}>
                    Add
                </Button>
            ),
            key: 'actions',
            align: 'center',
            width: 70,
            hidden: !(me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_USERS)),
            render: (text: string, record: User) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => handleEditModalOpenMember(record)}>
                        Edit
                    </Button>
                    <Button type="primary" danger onClick={() => handleRemoveMember(record)}>
                        Remove
                    </Button>
                </Space>
            ),
        },
    ];


    //handle remove member
    const handleRemoveMember= (user: User) => {
        setSelectedMember({ id: user.id, user: user, permissions: [], add_permissions: [], remove_permissions: [] });
        setRemoveConfirmVisibleMember(true);
    };

    const handleRemoveConfirmMember = async () => {
        if (selectedMember.id) {
            await group.remove_user(selectedMember.id);
            const updatedMembersList = updatedMembers.filter(user => user.id !== selectedMember.id);
            setUpdatedMembers(updatedMembersList);
        }

        handleRemoveCancelMember();
    };

    const handleRemoveCancelMember = () => {
        setSelectedMember({ id: undefined, user: undefined, permissions: [], add_permissions: [], remove_permissions: [] });
        setRemoveConfirmVisibleMember(false);
    };

    //handle create/edit member
    const handleAddModalOpenMember = () => {
        setEditModalVisibleMember(true);
    };

    const handleEditModalOpenMember = async (member: User) => {
        const permissions = await group.get_group_user_permissions(member.id);


        setSelectedMember({
            id:member.id,
            user:member,
            permissions: permissions,
            add_permissions: [], 
            remove_permissions: [],
        });
        setEditModalVisibleMember(true);

    };

    const handleEditModalCloseMember = () => {
        setSelectedMember({ id: undefined, user: undefined, permissions: [], add_permissions: [], remove_permissions: [] });
        setEditModalVisibleMember(false);
    };

    const handleEditMember = async () => {
        handleEditModalCloseMember();
        if (selectedMember.user !== undefined) {

            const aktMember = selectedMember.user;

            if(!selectedMember.id){
                await group.add_user(selectedMember.user.id);
                setUpdatedMembers([...updatedMembers, aktMember]);
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            selectedMember.add_permissions.forEach(async (permission: UserGroupPermissionEnum) => {
                await group.add_group_user_permission(aktMember.id, permission);
            });
            selectedMember.remove_permissions.forEach(async (permission: UserGroupPermissionEnum) => {
                await group.add_group_user_permission(aktMember.id, permission);
            });
        }
    };
    

    /// users search 

    const handleSelect = async (value: string) => {
        const selectedUser = users.find(user => user.id.toString() === value);

        setSelectedMember({
            ...selectedMember,
            user:selectedUser
        });
    };

    const handleClear = () => {
        setSelectedMember({
            ...selectedMember,
            user: undefined
        });
    };
    
    const handleSearch = (value: string) => {
        const filtered = users.filter(user =>
          user.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredUsers(filtered);
    };

    const permissionChange = (value: UserGroupPermissionEnum) => {
        const permissionIndex = selectedMember.permissions.indexOf(value);
        const add_permissionIndex = selectedMember.add_permissions.indexOf(value);
        const remove_permissionIndex = selectedMember.remove_permissions.indexOf(value);
        
        let updatedAddPermissions;
        let updatedRemovePermissions;

        if (permissionIndex !== -1) {
            // Permission exists, remove it
            if (add_permissionIndex !== -1){
                updatedAddPermissions = selectedMember.add_permissions.filter(permission => permission !== value);
                updatedRemovePermissions = selectedMember.remove_permissions;
            }
            else{
                updatedAddPermissions = selectedMember.add_permissions;
                updatedRemovePermissions = [...selectedMember.remove_permissions, value];
            }
            const updatedPermissions = selectedMember.permissions.filter(permission => permission !== value);
            setSelectedMember({ ...selectedMember, permissions: updatedPermissions, add_permissions: updatedAddPermissions, remove_permissions: updatedRemovePermissions  });
        } else {
            // Permission doesn't exist, add it
            if (remove_permissionIndex !== -1){
                updatedAddPermissions = selectedMember.add_permissions;
                updatedRemovePermissions = selectedMember.remove_permissions.filter(permission => permission !== value);;
            }
            else{
                updatedAddPermissions = [...selectedMember.add_permissions, value];
                updatedRemovePermissions = selectedMember.remove_permissions;
            }
            const updatedPermissions = [...selectedMember.permissions, value];
            setSelectedMember({ ...selectedMember, permissions: updatedPermissions, add_permissions: updatedAddPermissions, remove_permissions: updatedRemovePermissions  });
        }
    };

    return (
        <div>
            <Table
                columns={columns}
                dataSource={updatedMembers}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                rowKey={(record) => record.id}
                size="middle"
                scroll={{ x: '100%' }}
            />
            <Modal
                title="Confirm Remove"
                open={removeConfirmVisibleMember}
                onOk={handleRemoveConfirmMember}
                onCancel={handleRemoveCancelMember}
            >
                Are you sure you want to remove this member?
            </Modal>

            <Modal
                title="Member"
                open={editModalVisibleMember}
                onOk={handleEditMember}
                onCancel={() => handleEditModalCloseMember()}
                okButtonProps={{ disabled: !selectedMember.user }}
            >
                <Form layout="vertical">
                    {selectedMember.user && selectedMember.id ? (
                        <><UserAvatar key={selectedMember.user?.id} user={selectedMember.user} size={35}/><span style={{ marginLeft: 8 }}>{selectedMember.user.name}</span></>
                    ) : (
                        <Form.Item
                            name="select"
                            >
                            <Select
                                autoClearSearchValue
                                showSearch
                                placeholder="Select a person"
                                optionFilterProp="children"
                                onSelect={handleSelect}
                                onClear={handleClear}
                                onSearch={handleSearch}
                                filterOption={false}
                                allowClear
                                >
                                    {filteredUsers
                                        .filter(user => !updatedMembers.some(member => member.id === user.id))
                                        .map(user => (
                                            <Option key={user.id} value={user.id.toString()}>
                                                <UserAvatar user={user} />
                                                <span style={{ marginLeft: 8 }}>{user.name}</span>
                                            </Option>
                                        ))}
                            </Select>
                        </Form.Item>
                    )}
                    <Form.Item name="checkbox-group" label="Permissions">
                        <Space direction="vertical">
                            <Checkbox checked={selectedMember.permissions.includes(UserGroupPermissionEnum.ADMIN)} style={{ lineHeight: '32px' }} onChange={() => permissionChange(UserGroupPermissionEnum.ADMIN)}>
                                Admin
                            </Checkbox>
                            <Checkbox checked={selectedMember.permissions.includes(UserGroupPermissionEnum.MANAGE_USERS)} style={{ lineHeight: '32px' }} onChange={() => permissionChange(UserGroupPermissionEnum.MANAGE_USERS)}>
                                Manage Users
                            </Checkbox>
                            <Checkbox checked={selectedMember.permissions.includes(UserGroupPermissionEnum.MANAGE_EVENTS)} style={{ lineHeight: '32px' }} onChange={() => permissionChange(UserGroupPermissionEnum.MANAGE_EVENTS)}>
                                Manage Events
                            </Checkbox>
                            <Checkbox checked={selectedMember.permissions.includes(UserGroupPermissionEnum.MANAGE_VOTES)} style={{ lineHeight: '32px' }} onChange={() => permissionChange(UserGroupPermissionEnum.MANAGE_VOTES)}>
                                Manage Votes
                            </Checkbox>
                            <Checkbox checked={selectedMember.permissions.includes(UserGroupPermissionEnum.MANAGE_INVITES)} style={{ lineHeight: '32px' }} onChange={() => permissionChange(UserGroupPermissionEnum.MANAGE_INVITES)}>
                                Manage Invites
                            </Checkbox>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UsersGroupPage;
