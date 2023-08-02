import { useContext, useEffect, useState, useRef } from "react";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./Contact";
var options = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};
export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [offlineUsers, setOfflineUsers] = useState({});
  const { username, id } = useContext(UserContext);
  const divUnderMessages = useRef();
  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("reconnecting...");
        connectToWs();
      }, 1000);
    });
  }

  function showOnline(usersArray) {
    const users = {};
    usersArray.forEach(({ userId, username }) => {
      users[userId] = username;
    });
    setOnlineUsers(users);
  }
  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    if ("online" in messageData) {
      showOnline(messageData.online);
    } else if ("text" in messageData) {
      setMessages((prev) => [...prev, { ...messageData }]);
    }
  }

  function sendMessage(ev) {
    ev.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      })
    );
    setNewMessageText("");
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    axios.get("/users").then((res) => {
      const offlineUsersArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlineUsers).includes(p._id));
      const offlineUsers = {};
      offlineUsersArr.forEach((p) => {
        offlineUsers[p._id] = p;
      });
      setOfflineUsers(offlineUsers);
    });
  }, [onlineUsers]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const onlineUsersExcludeMe = { ...onlineUsers };
  delete onlineUsersExcludeMe[id];
  const messagesWithoutDuplicates = uniqBy(messages, "_id");
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <Logo />
        {Object.keys(onlineUsersExcludeMe).map((userId) => (
          <Contact
            key={userId}
            id={userId}
            online={true}
            username={onlineUsersExcludeMe[userId]}
            onClick={() => setSelectedUserId(userId)}
            selected={userId === selectedUserId}
          />
        ))}
        {Object.keys(offlineUsers).map((userId) => (
          <Contact
            key={userId}
            id={userId}
            online={false}
            username={offlineUsers[userId].username}
            onClick={() => setSelectedUserId(userId)}
            selected={userId === selectedUserId}
          />
        ))}
      </div>
      <div className="flex flex-col bg-blue-100 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="text-gray-400 text-xl flex gap-2 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z"
                    clipRule="evenodd"
                  />
                </svg>
                Please Select a User
              </div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDuplicates.map((message) => (
                  <div
                    key={message._id}
                    className={
                      message.sender === id ? "text-right" : "text-left"
                    }
                  >
                    <div
                      className={
                        "text-left inline-block p-2 m-2 rounded-xl text-sm " +
                        (message.sender === id
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-500")
                      }
                    >
                      {message.text}
                      {/*TODO: Date is not displayed immediately after sending a message. Need to fix*/}
                      <div className="text-xs text-gray-300 pt-2">
                        {new Date(message.createdAt).toLocaleDateString(
                          "en-US",
                          options
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(ev) => setNewMessageText(ev.target.value)}
              placeholder="Type message here"
              className="bg-white flex-grow border rounded-sm p-2"
            />
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
