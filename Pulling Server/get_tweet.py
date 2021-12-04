import tweepy
import json
import requests

consumer_key = '*'
consumer_secret = '*'
access_key = '*'
access_secret = '*'


class listener(tweepy.Stream):

    def on_data(self, data):
        print("------------------------------------------")
        tweet = json.loads(data)
        if("created_at" in tweet):
            # print(tweet)
            source = tweet["user"]["name"]
            message = tweet["text"]
            if "extended_tweet" in tweet:
                print("test")
                message = tweet["extended_tweet"]["full_text"]
            print(source)
            print(message)
            requests.post(url="http://ec2-54-215-167-214.us-west-1.compute.amazonaws.com:5000", json={"source":source, "tweet":message})
        return True

    def on_error(self, status):
        print(status)

twitterStream = listener(consumer_key, consumer_secret, access_key, access_secret)
twitterStream.filter(follow=["*"])