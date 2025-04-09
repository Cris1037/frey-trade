// pages/api/users/index.js
import { supabase } from '/supabase-client';

export default async function handler(req, res) {
  const { method, body } = req;
  const user = req.headers.user_id;

  switch (method) {
    case 'GET':
      const { data: users, error: getError } = await supabase
        .from('users')
        .select('*');
      if (getError) return res.status(500).json(getError);
      return res.status(200).json(users);

    case 'POST':
      const { email, first_name, last_name, password_hash, security_question, security_answer } = body;
      const { data: newUser, error: postError } = await supabase
        .from('users')
        .insert([{ email, first_name, last_name, password_hash, security_question, security_answer }])
        .single();
      if (postError) return res.status(500).json(postError);
      // create account record
      await supabase.from('accounts').insert([{ user_id: newUser.id }]);
      return res.status(201).json(newUser);

    case 'PUT':
      const { id, ...updateData } = body;
      const { data: updatedUser, error: putError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .single();
      if (putError) return res.status(500).json(putError);
      return res.status(200).json(updatedUser);

    case 'DELETE':
      const { id: deleteId } = body;
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', deleteId);
      if (deleteError) return res.status(500).json(deleteError);
      return res.status(204).end();

    default:
      res.setHeader('Allow', ['GET','POST','PUT','DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}