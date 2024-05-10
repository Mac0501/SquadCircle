import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, TableProps, Space, Select, Checkbox, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Group from '../../api/Group';
import TextArea from 'antd/es/input/TextArea';
import { UserGroupPermissionEnum } from '../../utils/types';
import User from '../../api/User';
import UserAvatar from '../../components/UserAvatar';

const { Option } = Select;

interface GroupsAdminPageProps {
    groups: Group[];
    users: User[];
}

interface GroupProps {
    id: number|null;
    name: string|null;
    description: string|null;
    members:Member[];
    added_members: number[];
    remove_members: number[];
    add_permissions: { [key: number]: UserGroupPermissionEnum[] };
    remove_permissions: { [key: number]: UserGroupPermissionEnum[] };
  }
  
  interface Member {
    id: number
    user: User
    permissions: UserGroupPermissionEnum[];
  }

  interface MemberAdd {
    id?: number
    user?: User
    permissions: UserGroupPermissionEnum[];
    add_permissions: UserGroupPermissionEnum[];
    remove_permissions: UserGroupPermissionEnum[];
  }

const GroupsAdminPage: React.FC<GroupsAdminPageProps> = ({ groups, users }) => {
    const [selectedUserId, setSelectedUserId] = useState<string|null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [discordWebhook, setDiscordWebhook] = useState<string | null | undefined>(undefined);
    const [selectedMember, setSelectedMember] = useState<MemberAdd>({ id: undefined, user: undefined, permissions: [], add_permissions: [], remove_permissions: [] });
    const [deleteConfirmVisibleGroup, setDeleteConfirmVisibleGroup] = useState<boolean>(false);
    const [removeConfirmVisibleMember, setRemoveConfirmVisibleMember] = useState<boolean>(false);
    const [updatedGroups, setUpdatedGroups] = useState<Group[]>(groups);
    const [finishingModalGroup, setFinishingModalGroup] = useState<boolean>(false);
    const [editModalVisibleGroup, setEditModalVisibleGroup] = useState<boolean>(false);
    const [editModalVisibleMember, setEditModalVisibleMember] = useState<boolean>(false);
    const [editGroup, setEditGroup] = useState<GroupProps>({ id: null, name: null, description: null, members: [], added_members: [], remove_members: [], add_permissions: {}, remove_permissions: {} });
    const [filteredUsers, setFilteredUsers] = useState<User[]>(users);

    const columnsGroupTable: TableProps<Group>['columns'] = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: '25%',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            align: 'left',
        },
        {
            title: 'Discord-Webhook',
            dataIndex: 'discord_webhook',
            key: 'discord_webhook',
            align: 'left',
            render: (discord_webhook: boolean, record:Group) => (
                record.discord_webhook ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        activated
                    </Tag>
                ) : (
                    <Tag icon={<CloseCircleOutlined />} color="error">
                        deactivated
                    </Tag>
                )
            ),
        },
        {
            title:() => (
                <Button type="primary" onClick={handleCreateModalOpenGroup}>
                    Create
                </Button>
            ),
            key: 'actions',
            align: 'center',
            width: 70,
            render: (text: string, record: Group) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => handleEditModalOpenGroup(record)}>
                        Edit
                    </Button>
                    <Button type="primary" danger onClick={() => handleDeleteGroup(record)}>
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    const columnsUsersTable: TableProps<Member>['columns'] = [
        {
            title: 'Avatar',
            key: 'avatar',
            align: 'center',
            width: 25,
            render: (text: string, record: Member) => <UserAvatar key={record.id} user={record.user} size={35}/>
        },
        {
            title: 'Name',
            dataIndex: 'user',
            key: 'name',
            align: 'left',
            render: (user: User) => user.name,
            
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
            render: (text: string, record: Member) => (
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

    const isNameAlreadyExists = (nameToCheck:string|null) => {
        if(nameToCheck === null){
            return false;
        }
        // Iterate over the existing groups
        for (const group of groups) {
            // Compare the name of each group with the name to check
            if (group.name === nameToCheck && group.id !== editGroup.id) {
                return true; // Name already exists
            }
        }
        return false; // Name does not exist
    };

    const isDiscordWebhookValid = (discord_webhook:string|null|undefined) => {
        if(discord_webhook === null || discord_webhook === undefined || discord_webhook === ""){
            return true;
        }
        if (discord_webhook.includes("https://discord.com/api/webhooks/")){
            return true;
        }
        return false;

    };


    ///handle delete group
    const handleDeleteGroup = (group: Group) => {
        setSelectedGroup(group);
        setDeleteConfirmVisibleGroup(true);
    };

    const handleDeleteConfirmGroup = async () => {
        if (selectedGroup) {
            const deleted = await selectedGroup.delete();
            if (deleted) {
                // Remove the deleted group from the list
                const updatedGroups = groups.filter(group => group.id !== selectedGroup.id);
                setUpdatedGroups(updatedGroups);
            }
        }
        setSelectedGroup(null);
        setDeleteConfirmVisibleGroup(false);
    };

    const handleDeleteCancelGroup = () => {
        setSelectedGroup(null);
        setDeleteConfirmVisibleGroup(false);
    };



    ///handle remove member
    const handleRemoveMember= (member: Member) => {
        setSelectedMember({...member, add_permissions: [], remove_permissions: []});
        setRemoveConfirmVisibleMember(true);
    };

    const handleRemoveConfirmMember = async () => {
        if (selectedMember.id) {
            // Remove selected member from editGroup.members
            const updatedMembers = editGroup.members.filter(member => member.id !== selectedMember.id);
            const updatedAddedMembers = editGroup.added_members.filter(id => id !== selectedMember.id);
            
            let updatedRemoveMembers;
            if (!editGroup.added_members.includes(selectedMember.id)){
                updatedRemoveMembers = [...editGroup.remove_members, selectedMember.id];
            }
            else{
                updatedRemoveMembers = editGroup.remove_members;
            }
            
            const { [selectedMember.id]: addPermissions, ...updatedAddPermissions } = editGroup.remove_permissions;
            const { [selectedMember.id]: removedPermissions, ...updatedRemovePermissions } = editGroup.remove_permissions;
    
            // Update editGroup with the new values
            setEditGroup({
                ...editGroup,
                members: updatedMembers,
                added_members: updatedAddedMembers,
                remove_members: updatedRemoveMembers,
                add_permissions: updatedAddPermissions,
                remove_permissions: updatedRemovePermissions,
            });
        }
    
        // Close the remove member modal
        handleRemoveCancelMember();
    };

    const handleRemoveCancelMember = () => {
        setSelectedMember({ id: undefined, user: undefined, permissions: [], add_permissions: [], remove_permissions: [] });
        setRemoveConfirmVisibleMember(false);
    };


    ///handle edit/create group
    const handleCreateModalOpenGroup = () => {
        setEditModalVisibleGroup(true);
        setSelectedGroup(null);
        setEditGroup({ id: null, name: null, description: null, members: [], added_members: [], remove_members: [], add_permissions: {}, remove_permissions: {} });

    };

    const handleEditModalOpenGroup = async (group:Group) => {
        setSelectedGroup(group);
        const members = await group.get_users();
        const membersMapped: Member[] = [];
        if(members){
            for (const user of members) {
                const member: Member = {
                    id: user.id,
                    user: user,
                    permissions: []
                };
                membersMapped.push(member);
            }
        }
        setEditGroup({ id: group.id, name: group.name, description: group.description, members: membersMapped, added_members: [], remove_members: [], add_permissions: {}, remove_permissions: {} });
        setEditModalVisibleGroup(true);
    };

    const handleEditModalCloseGroup = () => {
        setEditModalVisibleGroup(false);
        setDiscordWebhook(undefined);
        setEditGroup({ id: null, name: null, description: null, members: [], added_members: [], remove_members: [], add_permissions: {}, remove_permissions: {} });
    };

    const handleEditGroup = async () => {
        // Perform validation if needed
        setFinishingModalGroup(true)
        if (editGroup.name !== null) {
            let newSelectedGroup: Group | null;
            if (selectedGroup) {
                await selectedGroup.update(editGroup.name, editGroup.description, discordWebhook);
                newSelectedGroup = selectedGroup;
                const updatedIndex = updatedGroups.findIndex(group => group.id === selectedGroup.id);
                if (updatedIndex !== -1) {
                    const updatedGroupsCopy = [...updatedGroups];
                    updatedGroupsCopy[updatedIndex] = newSelectedGroup;
                    setUpdatedGroups(updatedGroupsCopy);
            }
            } else {
                newSelectedGroup = await Group.create(editGroup.name, editGroup.description, discordWebhook);
                setSelectedGroup(newSelectedGroup);
                if (newSelectedGroup !== null) {
                    setUpdatedGroups([...updatedGroups, newSelectedGroup]);
                }
            }
    
            if (newSelectedGroup !== null) {
                editGroup.remove_members.forEach(async (id: number) => {
                    await newSelectedGroup!.remove_user(id);
                });
                editGroup.added_members.forEach(async (id: number) => {
                    await newSelectedGroup!.add_user(id);
                });
                setTimeout(async () => {
                    Object.keys(editGroup.add_permissions).forEach((key: string) => {
                        const numberKey = Number(key);
                        const permissionList = editGroup.add_permissions[numberKey];
                        permissionList.forEach(async (permission: UserGroupPermissionEnum) => {
                            await newSelectedGroup!.add_group_user_permission(numberKey, permission);
                        });
                    });
                    Object.keys(editGroup.remove_permissions).forEach((key: string) => {
                        const numberKey = Number(key);
                        const permissionList = editGroup.remove_permissions[numberKey];
                        permissionList.forEach(async (permission: UserGroupPermissionEnum) => {
                            await newSelectedGroup!.remove_group_user_permission(numberKey, permission);
                        });
                    });
                }, 500);
            }
        }
        setFinishingModalGroup(false)
        handleEditModalCloseGroup();
    };


    ///handle edit/add member
    const handleAddModalOpenMember = () => {
        setEditModalVisibleMember(true);

    };

    const handleEditModalOpenMember = async (member: Member) => {
        let permissions
        if (member.permissions.length === 0 && selectedGroup){
            permissions = await selectedGroup.get_group_user_permissions(member.id);
        }
        else{
            permissions = member.permissions
        }


        setSelectedMember({
            id:member.id,
            user:member.user,
            permissions: permissions,
            add_permissions: editGroup.add_permissions[member.id] || [], 
            remove_permissions: editGroup.remove_permissions[member.id] || []
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
    
            // Map the selectedMember to a Member interface
            const selectedMemberMapped: Member = {
                id: selectedMember.user.id ,
                user: selectedMember.user,
                permissions: selectedMember.permissions
            };

            const existingMemberIndex = editGroup.members.findIndex(member => member.id === selectedMemberMapped.id);

            const updatedRemoveMembers = editGroup.remove_members.filter(id => id !== selectedMember.id);
            
            let updatedAddedMembers;
            if (!editGroup.remove_members.includes(selectedMemberMapped.id) && existingMemberIndex === -1){
                updatedAddedMembers = [...editGroup.added_members, selectedMemberMapped.id];
            }
            else{
                updatedAddedMembers = editGroup.added_members;
            }
    
            // If the user is already in the list, update the properties
            if (existingMemberIndex !== -1) {
                const updatedMembers = [...editGroup.members];
                updatedMembers[existingMemberIndex] = selectedMemberMapped;
    
                // Update the selectedGroup with the updated member and permissions
                setEditGroup({
                    ...editGroup,
                    members: updatedMembers,
                    add_permissions: {
                        ...editGroup.add_permissions,
                        [selectedMember.user.id]: selectedMember.add_permissions
                    },
                    remove_permissions: {
                        ...editGroup.remove_permissions,
                        [selectedMember.user.id]: selectedMember.remove_permissions
                    },
                    remove_members:updatedRemoveMembers,
                    added_members:updatedAddedMembers
                });
            } else {
                // If the user is not in the list, add the user as a new member
                const updatedMembers = [...editGroup.members, selectedMemberMapped];
    
                // Update the selectedGroup with the new member and permissions
                setEditGroup({
                    ...editGroup,
                    members: updatedMembers,
                    add_permissions: {
                        ...editGroup.add_permissions,
                        [selectedMember.user.id]: selectedMember.add_permissions
                    },
                    remove_permissions: {
                        ...editGroup.remove_permissions,
                        [selectedMember.user.id]: selectedMember.remove_permissions
                    },
                    remove_members:updatedRemoveMembers,
                    added_members:updatedAddedMembers
                });
            }
        }
    };
    

    /// users search 

    const handleSelect = async (value: string) => {
        setSelectedUserId(value)
        const selectedUser = users.find(user => user.id.toString() === value);

        if(selectedGroup && selectedUser){
            const permissions = await selectedGroup.get_group_user_permissions(Number(value));
            const add_permissions = selectedMember.permissions.filter(permission =>
                !permissions.includes(permission)
            );

            const remove_permissions = permissions.filter(permission =>
                !selectedMember.permissions.includes(permission)
            );

            setSelectedMember({
                ...selectedMember,
                user: selectedUser,
                add_permissions: add_permissions,
                remove_permissions: remove_permissions
            });
        }
        else{
            if (selectedUser) {
                setSelectedMember({
                    ...selectedMember,
                    user: selectedUser
                });
            }
        }
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
                columns={columnsGroupTable}
                dataSource={updatedGroups}
                pagination={{ pageSize: 15, showSizeChanger: false }}
                rowKey={(record) => record.id}
                size="middle"
                scroll={{ x: '100%' }}
            />

            <Modal
                title="Confirm Delete"
                open={deleteConfirmVisibleGroup}
                onOk={handleDeleteConfirmGroup}
                onCancel={handleDeleteCancelGroup}
            >
                Are you sure you want to delete this group?
            </Modal>

            <Modal
                title="Confirm Remove"
                open={removeConfirmVisibleMember}
                onOk={handleRemoveConfirmMember}
                onCancel={handleRemoveCancelMember}
            >
                Are you sure you want to remove this member?
            </Modal>

            <Modal
                title="Group"
                width="900px"
                open={editModalVisibleGroup}
                onOk={handleEditGroup}
                onCancel={handleEditModalCloseGroup}
                okButtonProps={{ disabled: !(editGroup.name !== null && editGroup.name.length > 0 && !isNameAlreadyExists(editGroup.name)), loading: finishingModalGroup}}
            >
                <Form layout="vertical">
                    <Form.Item label="Name" validateStatus={isNameAlreadyExists(editGroup.name) ? 'error' : ''} help={isNameAlreadyExists(editGroup.name) ? 'A Group with this name allready exists' : ''}>
                        <Input 
                            value={editGroup?.name || ''} 
                            maxLength={2000} 
                            onChange={(e) => {
                                setEditGroup({ ...editGroup, name: e.target.value });
                            }}
                        />
                    </Form.Item>
                    <Form.Item label="Discord-Webhook" validateStatus={isDiscordWebhookValid(discordWebhook) ? '':'error'} help={isDiscordWebhookValid(discordWebhook) ? '':'The Discord-Webhook has to start with "https://discord.com/api/webhooks/"'}>
                        <Input 
                            placeholder="Enter a Discord-Webhook to update (https://discord.com/api/webhooks/...)"
                            value={discordWebhook ? discordWebhook : ""} 
                            maxLength={130} 
                            onChange={(e) => {
                                setDiscordWebhook(e.target.value);
                            }}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" danger onClick={()=>(setDiscordWebhook(null))} disabled={discordWebhook === null}>Remove Discord-Webhook</Button>
                    </Form.Item>
                    <Form.Item label="Description">
                        <TextArea showCount maxLength={2000} placeholder="(optional)" value={editGroup?.description || ''} onChange={(e) => setEditGroup({ ...editGroup, description: e.target.value })} style={{ height: 100, resize: 'none' }} />
                    </Form.Item>
                </Form>

                <Table
                    columns={columnsUsersTable}
                    dataSource={editGroup.members}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    rowKey={(record) => record.id}
                    size="middle"
                    scroll={{ x: '100%' }}
                />
                
            </Modal>

            <Modal
                title="Member"
                open={editModalVisibleMember}
                onOk={handleEditMember}
                onCancel={() => {
                    handleEditModalCloseMember();
                    setSelectedUserId(null);
                }}
                okButtonProps={{ disabled: !selectedMember.user }}
            >
                <Form layout="vertical">
                    {selectedMember.user && selectedMember.id ? (
                        <><UserAvatar key={selectedMember.user?.id} user={selectedMember.user} size={35}/><span style={{ marginLeft: 8 }}>{selectedMember.user.name}</span></>
                    ) : (
                        <Form.Item
                            name="select"
                            initialValue={selectedUserId}
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
                                value={selectedUserId}
                                >
                                    {filteredUsers
                                        .filter(user => !editGroup.members.some(member => member.user.id === user.id))
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

export default GroupsAdminPage;
