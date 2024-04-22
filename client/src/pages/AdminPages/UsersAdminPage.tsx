import React, { useState } from 'react';
import { Table, Button, Modal, TableProps } from 'antd';
import User from '../../api/User';
import UserAvatar from '../../components/UserAvatar';

interface UsersProps {
    users: User[];
}

const UsersAdminPage: React.FC<UsersProps> = ({ users }) => {
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false);
    const [updatedUsers, setUpdatedUsers] = useState<User[]>(users);

    const columns: TableProps<User>['columns'] = [
        {
            title: 'Avatar',
            dataIndex: 'avatar',
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
            title: '',
            key: 'actions',
            align: 'center',
            width: 70,
            render: (text: string, record: User) => (
                <Button type="primary" danger onClick={() => handleDeleteUser(record)} disabled={record.owner}>
                    Delete
                </Button>
            ),
        },
    ];

    const handleDeleteUser = (user: User) => {
        setDeleteUser(user);
        setDeleteConfirmVisible(true);
    };

    const handleDeleteConfirm = async () => {
        if (deleteUser) {
            const deleted = await deleteUser.delete();
            if (deleted) {
                // Remove the deleted user from the list
                const updatedUsers = users.filter(user => user.id !== deleteUser.id);
                setUpdatedUsers(updatedUsers);
            }
        }
        setDeleteUser(null);
        setDeleteConfirmVisible(false);
    };

    const handleDeleteCancel = () => {
        setDeleteUser(null);
        setDeleteConfirmVisible(false);
    };

    return (
        <div>
            <Table
                columns={columns}
                dataSource={updatedUsers}
                pagination={{ pageSize: 15, showSizeChanger: false }}
                rowKey={(record) => record.id}
                size="middle"
                scroll={{ x: '100%' }}
            />
            <Modal
                title="Confirm Delete"
                open={deleteConfirmVisible}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            >
                Are you sure you want to delete this user?
            </Modal>
        </div>
    );
};

export default UsersAdminPage;
