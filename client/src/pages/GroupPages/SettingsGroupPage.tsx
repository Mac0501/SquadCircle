import React, { useState } from 'react';
import Me from '../../api/Me';
import Group from '../../api/Group';
import { UserGroupPermissionEnum } from '../../utils/types';
import { Button, Modal, Typography, message } from 'antd';

interface SettingsGroupPageProps {
    me: Me,
    group: Group,
    mePermissions: UserGroupPermissionEnum[];
}

const SettingsGroupPage: React.FC<SettingsGroupPageProps> = ({ me, group, mePermissions }) =>  {
    const [groupName, setGroupName] = useState<string>(group.name);
    const [groupDescription, setGroupDescription] = useState<string | null>(group.description);
    const [groupLeaveModalVisible, setGroupLeaveModalVisible] = useState<boolean>(false);
    const allowedToEdit = (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN));
    

    const updateGroup = async (name:string, description:string|null) => {
        if (!allowedToEdit || name.length === 0) {
            setGroupName(group.name)
            setGroupDescription(group.description)
            return; // Don't proceed if user is not allowed to edit
        }

        // Call the update method of the Group API
        const success = await group.update(name, description);

        if (success) {
            message.success('Group updated successfully'); // Show success message
        } else {
            setGroupName(group.name)
            setGroupDescription(group.description)
        }
    };

    const handleGroupLeave = async () => {
        const success = await Me.remove_me_from_group(group);
        if (success) {
            message.success('Group left successfully');
            window.location.href = "/homepage"
        } else {
            // Error leaving group
            message.error('Failed to leave group. Please try again later.');
        }
    };


    return (
        <div style={{ display: "flex", flexDirection:"column", alignItems: "start", justifyContent: "start", gap:'10px' }}>
            <div style={{marginTop:'24px', marginBottom:'12px', width:'100%'}}>
                <Typography.Title
                    level={3}
                    style={{margin:'0px', width:'100%'}}
                    { ...(allowedToEdit ? { editable: { 
                                            onChange: (name:string) => {
                                                setGroupName(name);
                                                updateGroup(name, group.description); 
                                            },
                                            enterIcon: null,
                                            maxLength:32,
                                        } } : {}) }
                >
                    {groupName}
                </Typography.Title>
            </div>
            <Typography.Paragraph
                style={{margin:'0px', width:'100%'}}
                { ...(allowedToEdit ? { editable: { 
                                        onChange: (description:string) => {
                                            setGroupDescription(description);
                                            updateGroup(group.name, description);
                                        },
                                        enterIcon: null,
                                        maxLength:2000,
                                    } } : {}) }
            >
                {groupDescription}
            </Typography.Paragraph>
            <Button type="primary" danger onClick={() => setGroupLeaveModalVisible(true)}>
                Leave Group
            </Button>
            <Modal
                title="Confirm Group Leave"
                open={groupLeaveModalVisible}
                onOk={handleGroupLeave}
                onCancel={() => setGroupLeaveModalVisible(false)}
                okText="Leave"
                cancelText="Cancel"
            >
                Are you sure you want to leave this Group?
            </Modal>
        </div>
    );
};

export default SettingsGroupPage;
