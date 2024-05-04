import React, { useEffect, useState } from 'react';
import Me from '../api/Me';
import Vote from '../api/Vote';
import { UserGroupPermissionEnum } from '../utils/types';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, List, Typography } from 'antd';
import VoteOption from '../api/VoteOption';
import VoteOptionCard from './VoteOptionCard';
import VoteModal from './VoteModal';
import Group from '../api/Group';
import User from '../api/User';
import UserVoteOptionResponse from '../api/UserVoteOptionResponse';

interface VoteCardProps {
    me: Me;
    vote: Vote;
    mePermissions: UserGroupPermissionEnum[];
    group: Group;
    members: User[];
    onDelete: (deletedVote: Vote) => void;
}



const VoteCard: React.FC<VoteCardProps> = ({ me, vote, mePermissions, group, members, onDelete }) =>  {
    const [voteModalVisible, setVoteModalVisible] = useState<boolean>(false);
    const [currentVote, setCurrentVote] = useState<Vote>(vote);

    useEffect(() => {
        setCurrentVote(vote); 
    }, [vote]);

    const handleOpenVoteModal = () => {
        setVoteModalVisible(true);
    };

    const handleCloseVoteModal = () => {
        setVoteModalVisible(false);
    };

    const handleFinishVote = (voteData: Vote) => {
        setCurrentVote(voteData);
        setVoteModalVisible(false);
    };

    const handleDeleteVote = async () => {
        await vote.delete();
        setVoteModalVisible(false);
        onDelete(vote);
    };

    const handleCheckVoteOption = (userVoteOptionResponse: UserVoteOptionResponse|null) => {
        if (vote?.multi_select === false && userVoteOptionResponse !== null && currentVote.vote_options){
            const updatedVote = new Vote(
                currentVote.id,
                currentVote.title,
                currentVote.created,
                currentVote.multi_select,
                currentVote.group_id,
                currentVote.vote_options
            ); // Create a new instance of Vote with the currentVote properties
    
            for (const vo of updatedVote.vote_options!) {
                if(vo.id !== userVoteOptionResponse.vote_option_id){
                    const new__user_vote_option_response_vo = vo.user_vote_option_responses?.filter(response =>response.user_and_group?.user_id !== me.id)
                    vo.user_vote_option_responses = new__user_vote_option_response_vo ? new__user_vote_option_response_vo : [];
                }
            }
            setCurrentVote(updatedVote); // Update state with the new Vote instance
        }
    };

    return (
        <div>
            <Card 
                title={vote.title}
                extra={<Typography.Link onClick={handleOpenVoteModal}><InfoCircleOutlined style={{ fontSize: '18px' }}/></Typography.Link>}
                // style={{ borderTopWidth:'5px', borderTopColor:`#${vote.color}` }}
            >   
                <div style={{height:"360px" , maxHeight:"360px"}}>
                {vote.multi_select ? (
                    "Select atleast one option."
                ) : (
                    "Select one option."
                )}
                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '5px' }}>
                    <List
                        grid={{
                            xs: 1,
                            sm: 1,
                            md: 1,
                            lg: 1,
                            xl: 1,
                            xxl: 1,
                        }}
                        dataSource={currentVote.vote_options ? currentVote.vote_options : []}
                        renderItem={(vote_option: VoteOption) => (
                            <List.Item>
                                <VoteOptionCard
                                    key={vote_option.id}
                                    me={me}
                                    vote_option={vote_option}
                                    mePermissions={mePermissions}
                                    onCheck={(userVoteOptionResponse: UserVoteOptionResponse|null)=>{handleCheckVoteOption(userVoteOptionResponse)}}
                                    members={members}
                                />
                            </List.Item>
                        )}
                    />
                </div>
                </div>
            </Card>
            <VoteModal me={me} mePermissions={mePermissions} vote={vote} visible={voteModalVisible} onFinish={handleFinishVote} onDelete={handleDeleteVote} onCancel={handleCloseVoteModal} group={group} members={members}/>
        </div>
    );
};


export default VoteCard;
