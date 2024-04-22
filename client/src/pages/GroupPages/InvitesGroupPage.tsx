import React, { useState } from 'react';
import { Form, Button, TableProps, Table, Modal, Select, Space} from 'antd';

import Invite from '../../api/Invites';
import Group from '../../api/Group';

interface InvitesGroupPageProps {
    group: Group;
    invites: Invite[];
  }

  interface InviteProps {
    expiration_date?: number;
  }


  const InvitesGroupPage: React.FC<InvitesGroupPageProps> = ({ group, invites }) =>  {
    const [updatedInvites, setUpdatedInvites] = useState<Invite[]>(invites);
    const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
    const [deleteConfirmVisibleInvite, setDeleteConfirmVisibleInvite] = useState<boolean>(false);
    const [createModalVisibleInvite, setCreateModalVisibleInvite] = useState<boolean>(false);
    const [createInvite, setCreateInvite] = useState<InviteProps>({ expiration_date:undefined });

    const columnsGroupTable: TableProps<Invite>['columns'] = [
      {
          title: 'Code',
          dataIndex: 'code',
          key: 'code',
          align: 'center',
      },
      {
          title: 'Expiration Date',
          dataIndex: 'expiration_date',
          key: 'expiration_date',
          align: 'center',
      },
      {
          title:() => (
              <Button type="primary" onClick={handleCreateModalOpenInvite}>
                  Create
              </Button>
          ),
          key: 'actions',
          align: 'center',
          width: 70,
          render: (text: string, record: Invite) => (
            <Space size="middle">
              <Button type="primary" onClick={() => navigator.clipboard.writeText(record.get_link())} style={{ marginRight: 8 }}>
                  Copy
              </Button>
              <Button type="primary" danger onClick={() => handleDeleteInvite(record)}>
                Delete
              </Button>
            </Space>
          ),
      },
  ];

    ///handle remove invite
    const handleDeleteInvite= (invite: Invite) => {
      setSelectedInvite(invite);
      setDeleteConfirmVisibleInvite(true);
  };

  const handleDeleteConfirmInvite = async () => {
      if (selectedInvite) {
          // Remove selected member from createInvite.members
          const updatedInvitesList = updatedInvites.filter(invite => invite.id !== selectedInvite.id);

          await selectedInvite.delete();

          setUpdatedInvites(updatedInvitesList);
      }
  
      // Close the remove member modal
      handleDeleteCancelInvite();
  };

  const handleDeleteCancelInvite = () => {
      setSelectedInvite(null);
      setDeleteConfirmVisibleInvite(false);
  };


  ///handle create invite
  const handleCreateModalOpenInvite = () => {
      setCreateModalVisibleInvite(true);
      setCreateInvite({ expiration_date:undefined });

  };

  const handleCreateModalCloseInvite = () => {
      setCreateModalVisibleInvite(false);
      setCreateInvite({ expiration_date:undefined });
  };

  const handleCreateInvite = async () => {
      // Perform validation if needed
      if (createInvite.expiration_date) {
        // Calculate expiration date by adding the selected number of days to the current date
        const currentDate = new Date();
        const expirationDate = new Date(currentDate.setDate(currentDate.getDate() + createInvite.expiration_date));

        // Format the expiration date in ISO8601 format (YYYY-MM-DD)
        const formattedExpirationDate = expirationDate.toISOString().split('T')[0];

        // Create the invite using the expiration date
        const invite = await group.create_invite(formattedExpirationDate);

        if(invite){
        setUpdatedInvites([...updatedInvites, invite])
        }
      }
      handleCreateModalCloseInvite();
  };

    return (
        <div>
          <Table
                columns={columnsGroupTable}
                dataSource={updatedInvites}
                pagination={{ pageSize: 15, showSizeChanger: false }}
                rowKey={(record) => record.id}
                size="middle"
                scroll={{ x: '100%' }}
            />
          <Modal
              title="Confirm Delete"
              open={deleteConfirmVisibleInvite}
              onOk={handleDeleteConfirmInvite}
              onCancel={handleDeleteCancelInvite}
          >
              Are you sure you want to delete this Invite?
          </Modal>

          <Modal
              title="Invite"
              open={createModalVisibleInvite}
              onOk={handleCreateInvite}
              onCancel={handleCreateModalCloseInvite}
              okButtonProps={{disabled:createInvite.expiration_date === undefined}}
          >
            <Form layout="vertical">
                <Form.Item label="Expiration Date" name="expirationDate">
                    <Select onChange={(value) => setCreateInvite({ ...createInvite, expiration_date: value })} value={createInvite.expiration_date} allowClear>
                        <Select.Option value={2}>2 days</Select.Option>
                        <Select.Option value={7}>7 days</Select.Option>
                        <Select.Option value={14}>14 days</Select.Option>
                        <Select.Option value={30}>30 days</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
              
          </Modal>
        </div>
    );
};

export default InvitesGroupPage;
