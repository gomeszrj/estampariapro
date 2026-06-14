import { supabase } from './supabase';
import { notify } from '../components/ui/toast';

export interface MetaAccount {
    id: string;
    name: string;
    platform: 'facebook' | 'instagram';
    accessToken: string;
}

export interface PostPayload {
    message: string;
    imageUrl?: string;
    platform: 'instagram' | 'facebook';
}

class SocialMediaBotService {
    /**
     * Get configured accounts for the tenant
     */
    async getAccounts(): Promise<MetaAccount[]> {
        try {
            // For now, this can come from tenant settings
            const { data, error } = await supabase
                .from('tenant_settings')
                .select('meta_accounts')
                .single();

            if (error) throw error;
            return data?.meta_accounts || [];
        } catch (error) {
            console.error('Error fetching meta accounts:', error);
            return [];
        }
    }

    /**
     * Posts content to the specified platform
     */
    async createPost(payload: PostPayload, accountId: string, accessToken: string): Promise<boolean> {
        try {
            if (payload.platform === 'facebook') {
                return await this.postToFacebook(payload, accountId, accessToken);
            } else if (payload.platform === 'instagram') {
                return await this.postToInstagram(payload, accountId, accessToken);
            }
            return false;
        } catch (error: any) {
            console.error('Error posting to social media:', error);
            notify.error(`Erro ao postar no ${payload.platform}: ${error.message || 'Erro desconhecido'}`);
            return false;
        }
    }

    private async postToFacebook(payload: PostPayload, pageId: string, accessToken: string) {
        let endpoint = `https://graph.facebook.com/v19.0/${pageId}`;
        const formData = new FormData();
        
        formData.append('access_token', accessToken);
        formData.append('message', payload.message);

        if (payload.imageUrl) {
            endpoint += '/photos';
            formData.append('url', payload.imageUrl);
        } else {
            endpoint += '/feed';
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        notify.success('Post publicado no Facebook com sucesso!');
        return true;
    }

    private async postToInstagram(payload: PostPayload, igAccountId: string, accessToken: string) {
        if (!payload.imageUrl) {
            throw new Error('O Instagram exige uma imagem para publicar.');
        }

        // Step 1: Create Media Container
        const containerEndpoint = `https://graph.facebook.com/v19.0/${igAccountId}/media`;
        const containerFormData = new FormData();
        containerFormData.append('access_token', accessToken);
        containerFormData.append('image_url', payload.imageUrl);
        containerFormData.append('caption', payload.message);

        const containerResponse = await fetch(containerEndpoint, {
            method: 'POST',
            body: containerFormData,
        });

        const containerData = await containerResponse.json();

        if (containerData.error) {
            throw new Error(containerData.error.message);
        }

        const creationId = containerData.id;

        // Step 2: Publish Media Container
        const publishEndpoint = `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`;
        const publishFormData = new FormData();
        publishFormData.append('access_token', accessToken);
        publishFormData.append('creation_id', creationId);

        const publishResponse = await fetch(publishEndpoint, {
            method: 'POST',
            body: publishFormData,
        });

        const publishData = await publishResponse.json();

        if (publishData.error) {
            throw new Error(publishData.error.message);
        }

        notify.success('Post publicado no Instagram com sucesso!');
        return true;
    }
}

export const socialMediaBotService = new SocialMediaBotService();
