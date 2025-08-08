using AutoMapper;
using BataWebsite.Models;

namespace BataWebsite
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Reward, RewardDTO>();

            CreateMap<RedeemedReward, RedeemedRewardDTO>();
            CreateMap<RedeemedRewardRequest, RedeemedReward>();
        }
    }
}
