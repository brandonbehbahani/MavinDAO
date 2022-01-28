import { useMoralisDapp } from "providers/MoralisDappProvider/MoralisDappProvider";
import { useMoralisQuery, useWeb3ExecuteFunction } from "react-moralis";
import { useEffect, useState, createElement } from "react";
import { Comment, Tooltip, Avatar, message, Divider } from "antd";
import { DislikeOutlined, LikeOutlined, DislikeFilled, LikeFilled } from "@ant-design/icons";
import Text from "antd/lib/typography/Text";
import Blockie from "components/Blockie";
import glStyles from "components/gstyles";
import Votes from "./Votes"
import useNativeTransactions from "hooks/useNativeTransactions";
import { useMoralis } from "react-moralis";

const Post = ({post}) => {
    const { nativeTransactions, chainId } = useNativeTransactions();
    const { Moralis } = useMoralis();
    const { contentId, postId, postOwner } = post;
    const [postContent, setPosContent] = useState({ title: "default", content: "default" });
    const { data } = useMoralisQuery("Contents", (query) => query.equalTo("contentId", contentId));
    const [voteStatus, setVoteStatus] = useState();
    const { data: votes } = useMoralisQuery("Votes", (query) => query.equalTo("postId", postId), [], {
        live: true,
    });
    
    const { walletAddress, contractABI, contractAddress} = useMoralisDapp();
    const contractABIJson = JSON.parse(contractABI);
    const contractProcessor = useWeb3ExecuteFunction();


    useEffect(() => {
        function extractUri(data) {
          const fetchedContent = JSON.parse(JSON.stringify(data, ["contentUri"]));
          const contentUri = fetchedContent[0]["contentUri"];
          return contentUri;
        }
        async function fetchIPFSDoc(ipfsHash) {
          console.log(ipfsHash);
          const url = ipfsHash;
          const response = await fetch(url);
          return await response.json();
        }
        async function processContent() {
          const content = await fetchIPFSDoc(extractUri(data));
          setPosContent(content);
        }
        if (data.length > 0) {
          processContent();
        }
      }, [data]);
    
    useEffect(() => {
        if (!votes?.length) return null;

        async function getPostVoteStatus() {
            const fetchedVotes = JSON.parse(JSON.stringify(votes));
            fetchedVotes.forEach(({ voter, up }) => {
            if (voter === walletAddress) setVoteStatus(up ? "liked" : "disliked");
            });
            return;
        }

        getPostVoteStatus();
    }, [votes, walletAddress]);
    
    async function sendEth(){
      // sending 0.01 ETH
      const options = {type: "native", amount: Moralis.Units.ETH("0.01"), receiver: "0xEbAE227Ed262B1BF55cff85fcB47bc22DFfC9C79"}
      let result = await Moralis.transfer(options)
    }

    async function vote(direction){
        if (walletAddress.toLowerCase() === postOwner.toLowerCase()) return message.error("You cannot vote on your posts");
        if (voteStatus) return message.error("Already voted");
        const options = {
            contractAddress: contractAddress,
            functionName: direction,
            abi: contractABIJson,
            params: {
              _postId: post["postId"],
              [direction === "voteDown" ? "_reputationTaken" : "_reputationAdded"]: 1,
            },
          };
          await contractProcessor.fetch({
            params: options,
            onSuccess: () => console.log(result),
            onError: (error) => console.error(error),
          });
    }
    
    const actions = [
    <Tooltip key="comment-basic-like" title="Vote Up">
        <span
        style={{ fontSize: "15px", display: "flex", alignItems: "center", marginRight: "16px" }}
        onClick={() => vote("voteUp")}
        >
        {createElement(voteStatus === "liked" ? LikeFilled : LikeOutlined)} Vote Up
        </span>
    </Tooltip>,
    <span style={{ fontSize: "15px" }}><Votes postId={postId}/></span>,
    <Tooltip key="comment-basic-dislike" title="Dislike">
        <span
        style={{ fontSize: "15px", display: "flex", alignItems: "center", marginLeft: "8px" }}
        onClick={() => vote("voteDown")}
        >
        {createElement(voteStatus === "disliked" ? DislikeFilled : DislikeOutlined)} Vote Down
        </span>
    </Tooltip>,
    ];  

    const loading = "";

    const result = (
        <Comment
        style={{ ...glStyles.card, padding: "0px 15px", marginBottom: "10px" }}
        actions={actions}
        author={<Text strong>{post["postOwner"]}</Text>}
        avatar={<Avatar src={<Blockie address={post["postOwner"]} scale="4" />}></Avatar>}
        content={
            <>
            <Text strong style={{ fontSize: "20px", color: "#333" }}>
                {postContent["title"]}
            </Text>
            <p style={{ fontSize: "15px", color: "#111" }}>{postContent["content"]}</p>
            <Divider style={{ margin: "15px 0" }} />
            <button onclick={() => sendEth()}>Donate Eth for project proposal</button>
            <p style={{fontSize: "10px", colos: "grey"}}>Currently default donation is 0.01 ether.</p>
            <p style={{fontSize: "10px", colos: "grey"}}>Default Donation results in 100 fanDao tokens.</p>
            </>
        }
      />
    )
    
    
    return postContent["title"] === "default" ? loading : result;
}

export default Post
