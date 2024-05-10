import asyncio
import discord
from discord import Embed, Webhook
import aiohttp

async def send_with_webhook(url:str, embed:Embed):
    try:
        async with aiohttp.ClientSession() as session:
            webhook = Webhook.from_url(url, session=session)
            await webhook.send(embed=embed, username="SquadCircle")
    except:
        pass