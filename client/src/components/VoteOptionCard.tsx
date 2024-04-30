import React, { useEffect, useState } from 'react';
import Me from '../api/Me';
import {  UserGroupPermissionEnum } from '../utils/types';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Card, Checkbox, Input, Modal, Progress, Tooltip } from 'antd';
import VoteOption from '../api/VoteOption';
import User from '../api/User';
import UserVoteOptionResponse from '../api/UserVoteOptionResponse';

interface VoteOptionCardProps {
    me: Me,
    vote_option: VoteOption|VoteOptionProp;
    mePermissions: UserGroupPermissionEnum[];
    editable?: boolean;
    onCheck?: (userVoteOptionResponse: UserVoteOptionResponse|null) => void;
    onEdit?: (updatedVoteOption: VoteOptionProp) => void;
    onDelete?: (updatedVoteOption: VoteOptionProp) => void;
    members: User[];
}

interface VoteOptionProp {
    id: number|null
    title: string;
    vote_id: number | null;
    user_vote_option_responses: UserVoteOptionResponse[] | null;
}

async function toggel_user_vote_option_response(vote_option_id:number): Promise<UserVoteOptionResponse|null> {
    try {
        const response = await fetch(`/api/vote_options/${vote_option_id}/user_vote_option_response/toggel`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const responseData = await response.json();
            if(responseData.hasOwnProperty("message")){
                return null;
            }
            return UserVoteOptionResponse.fromJson(responseData);
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error creating user vote option response:', error);
        return null;
    }
}

const VoteOptionCard: React.FC<VoteOptionCardProps> = ({ me, vote_option, mePermissions, editable = false, onCheck, onEdit, onDelete, members }) => {
    const [deleteConfirmVisibleVoteOption, setDeleteConfirmVisibleVoteOption] = useState<boolean>(false);
    const [editModalVisibleVoteOption, setEditModalVisibleVoteOption] = useState<boolean>(false);
    const [choosenOption, setChoosenOption] = useState<UserVoteOptionResponse|null>(null);


    const [voted, setVoted] = useState<number>(0);
    const [possibleVotes, setPossibleVotes] = useState<number>(0);


    useEffect(() => {
        // Calculate counts of ACCEPTED and DENIED responses when component mounts
        const userVoteOptionResponse = vote_option.user_vote_option_responses?.find(response => {
            return response.user_and_group && response.user_and_group.user_id === me.id;
        });
        setChoosenOption(userVoteOptionResponse ? userVoteOptionResponse : null);
        const accepted = vote_option.user_vote_option_responses?.length || 0;
        const denied = members.length;
        setVoted(accepted);
        setPossibleVotes(denied);
    }, [me.id, members.length, vote_option.user_vote_option_responses]);

    const updateCounts = () => {
        const accepted = vote_option.user_vote_option_responses?.length || 0;
        const denied = members.length;
        setVoted(accepted);
        setPossibleVotes(denied);
    };

    const onChooseOption = async () => {
        if (vote_option.id !== null) {
            const new__user_vote_option_response = await toggel_user_vote_option_response(vote_option.id);
            const new__user_vote_option_responses = vote_option.user_vote_option_responses ? vote_option.user_vote_option_responses.filter(response => response.user_and_group?.user_id !== me.id) : []
            if (new__user_vote_option_response === null) {
                vote_option.user_vote_option_responses = new__user_vote_option_responses
            } else {
                vote_option.user_vote_option_responses = [...new__user_vote_option_responses, new__user_vote_option_response]
            }
            if(onCheck){onCheck(new__user_vote_option_response);}
            setChoosenOption(new__user_vote_option_response);
            updateCounts();
        }
    };


    return (
        <div>
            <Card 
                hoverable
                actions={editable ? [
                    <Tooltip title="Edit this vote option." trigger="hover">
                        <EditOutlined key="edit" onClick={()=>{setEditModalVisibleVoteOption(true)}}/>
                    </Tooltip>,
                    <Tooltip title="Delete vote option." trigger="hover">
                        <DeleteOutlined key="delete" onClick={()=>{setDeleteConfirmVisibleVoteOption(true)}}/>
                    </Tooltip>
                ] : []}
            >
                <div style={{ display: "flex", flexDirection:"row", alignItems: "start", justifyContent: "center", height:"100%", width:'100%' }}>
                    <div style={{ display: "flex", alignItems: "start", justifyContent: "center", height:"100%", marginRight:'5px'}}>
                        <Checkbox disabled={(vote_option.id === null)} checked={choosenOption ? true : false} onChange={(e)=>{onChooseOption()}}/>
                    </div>
                    <div style={{ display: "flex", flexDirection:"column", alignItems: "center", justifyContent: "center", height:"100%", width:'100%' }}>
                        <div style={{ display: "flex", flexDirection:"row", alignItems: "center", justifyContent: "space-between", height:"100%", width:'100%' }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "start", height:"100%", width:'80%' }}>
                                <span style={{ overflowWrap: 'break-word', wordWrap: 'break-word', maxWidth:'100%' }}>
                                    {vote_option.title}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "end", height:"100%", width:'20%' }}>
                                {voted}
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection:"column", alignItems: "center", justifyContent: "center", height:"100%", width:'100%' }}>
                            <Progress strokeColor="#aaaaaa" percent={(voted / possibleVotes) * 100} type="line" showInfo={false} style={{width:"100%"}}/>
                        </div>
                    </div>
                </div>
            </Card>
            <Modal
                title="Confirm Delete"
                open={deleteConfirmVisibleVoteOption}
                onOk={() => { setDeleteConfirmVisibleVoteOption(false); if(onDelete){onDelete(vote_option);} }}
                onCancel={()=>{setDeleteConfirmVisibleVoteOption(false);}}
            >
                Are you sure you want to delete this Vote-Option?
            </Modal>
            <Modal
                title="Vote-Option"
                open={editModalVisibleVoteOption}
                onOk={() => { 
                    if (onEdit) {
                        const updatedVoteOption: VoteOptionProp = {
                            ...vote_option,
                        };
                        onEdit(updatedVoteOption);
                    }
                    setEditModalVisibleVoteOption(false);
                }}
                onCancel={()=>{setEditModalVisibleVoteOption(false);}}
                okButtonProps={{ disabled: !(vote_option.title.length > 0 && vote_option.title.length <= 100) }}
            >
                <Input maxLength={100} value={vote_option.title} onChange={(e) =>{vote_option.title = e.target.value}}></Input>
            </Modal>
        </div>
    );
};

export default VoteOptionCard;
